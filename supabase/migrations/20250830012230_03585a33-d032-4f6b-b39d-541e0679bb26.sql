-- Security Fix: Force drop problematic view and complete security hardening
-- Force drop the problematic view with CASCADE
DROP VIEW IF EXISTS public.safe_participant_profiles CASCADE;

-- Create banking_details table for sensitive financial data
CREATE TABLE IF NOT EXISTS public.banking_details (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  bank_name text,
  account_type text,
  account_number text,
  bank_email text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  UNIQUE(user_id)
);

-- Enable RLS on banking_details with strict owner-only access
ALTER TABLE public.banking_details ENABLE ROW LEVEL SECURITY;

-- Drop existing policy if it exists and recreate
DROP POLICY IF EXISTS "Users can only access their own banking details" ON public.banking_details;
CREATE POLICY "Users can only access their own banking details"
ON public.banking_details
FOR ALL
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Migrate existing banking data from profiles to banking_details (with conflict handling)
INSERT INTO public.banking_details (user_id, bank_name, account_type, account_number, bank_email, created_at, updated_at)
SELECT id, bank_name, account_type, account_number, bank_email, created_at, updated_at
FROM public.profiles
WHERE id IS NOT NULL AND (bank_name IS NOT NULL OR account_type IS NOT NULL OR account_number IS NOT NULL OR bank_email IS NOT NULL)
ON CONFLICT (user_id) DO NOTHING;

-- Now safely remove banking columns from profiles table
ALTER TABLE public.profiles 
DROP COLUMN IF EXISTS bank_name CASCADE,
DROP COLUMN IF EXISTS account_type CASCADE, 
DROP COLUMN IF EXISTS account_number CASCADE,
DROP COLUMN IF EXISTS bank_email CASCADE;

-- Add trigger for banking_details updated_at if it doesn't exist
DROP TRIGGER IF EXISTS update_banking_details_updated_at ON public.banking_details;
CREATE TRIGGER update_banking_details_updated_at
BEFORE UPDATE ON public.banking_details
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at();