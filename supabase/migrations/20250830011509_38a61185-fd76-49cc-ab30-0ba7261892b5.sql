-- Security Fix: Handle existing policies and complete the security hardening
-- First, check if banking_details table already exists
DO $$
BEGIN
    -- Create banking_details table if it doesn't exist
    IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'banking_details') THEN
        CREATE TABLE public.banking_details (
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

        -- Banking details can only be accessed by the owner
        CREATE POLICY "Users can only access their own banking details"
        ON public.banking_details
        FOR ALL
        TO authenticated
        USING (auth.uid() = user_id)
        WITH CHECK (auth.uid() = user_id);

        -- Add trigger for banking_details updated_at
        CREATE TRIGGER update_banking_details_updated_at
        BEFORE UPDATE ON public.banking_details
        FOR EACH ROW
        EXECUTE FUNCTION public.handle_updated_at();
    END IF;
END $$;

-- Migrate existing banking data if banking columns still exist
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'bank_name') THEN
        -- Migrate existing banking data from profiles to banking_details
        INSERT INTO public.banking_details (user_id, bank_name, account_type, account_number, bank_email, created_at, updated_at)
        SELECT id, bank_name, account_type, account_number, bank_email, created_at, updated_at
        FROM public.profiles
        WHERE id IS NOT NULL AND (bank_name IS NOT NULL OR account_type IS NOT NULL OR account_number IS NOT NULL OR bank_email IS NOT NULL)
        ON CONFLICT (user_id) DO NOTHING;

        -- Remove banking columns from profiles table
        ALTER TABLE public.profiles 
        DROP COLUMN IF EXISTS bank_name,
        DROP COLUMN IF EXISTS account_type, 
        DROP COLUMN IF EXISTS account_number,
        DROP COLUMN IF EXISTS bank_email;
    END IF;
END $$;

-- Clean up and recreate RLS policies on profiles
DROP POLICY IF EXISTS "Users can view their own complete profile" ON public.profiles;
DROP POLICY IF EXISTS "Account owners can view participant basic info only" ON public.profiles;
DROP POLICY IF EXISTS "Co-participants can view other participant basic info only" ON public.profiles;
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Account owners can view basic participant info" ON public.profiles;
DROP POLICY IF EXISTS "Co-participants can view basic participant info" ON public.profiles;

-- Create simple, secure RLS policies for profiles
CREATE POLICY "Users can view their own complete profile"
ON public.profiles
FOR SELECT
TO authenticated
USING (auth.uid() = id);

CREATE POLICY "Account owners can view basic participant info"
ON public.profiles  
FOR SELECT
TO authenticated
USING (
  id != auth.uid() AND EXISTS (
    SELECT 1 FROM accounts a
    JOIN account_participants ap ON a.id = ap.account_id
    WHERE a.owner_id = auth.uid() AND ap.participant_id = profiles.id
  )
);

CREATE POLICY "Co-participants can view basic participant info"
ON public.profiles
FOR SELECT  
TO authenticated
USING (
  id != auth.uid() AND EXISTS (
    SELECT 1 FROM account_participants ap1
    JOIN account_participants ap2 ON ap1.account_id = ap2.account_id
    WHERE ap1.participant_id = auth.uid() AND ap2.participant_id = profiles.id
  )
);

-- Update get_participant_basic_info function with proper authorization
CREATE OR REPLACE FUNCTION public.get_participant_basic_info(participant_id uuid)
RETURNS TABLE(id uuid, name text, email text, avatar_url text)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  SELECT p.id, p.name, p.email, p.avatar_url
  FROM profiles p
  WHERE p.id = participant_id
    AND (
      -- User can view their own info
      auth.uid() = participant_id
      OR
      -- Account owners can view their participants' basic info
      EXISTS (
        SELECT 1 FROM accounts a
        JOIN account_participants ap ON a.id = ap.account_id
        WHERE a.owner_id = auth.uid() AND ap.participant_id = participant_id
      )
      OR  
      -- Co-participants can view each other's basic info
      EXISTS (
        SELECT 1 FROM account_participants ap1
        JOIN account_participants ap2 ON ap1.account_id = ap2.account_id
        WHERE ap1.participant_id = auth.uid() AND ap2.participant_id = participant_id
      )
    );
$function$;

-- Update get_owner_payment_info to use new banking_details table
CREATE OR REPLACE FUNCTION public.get_owner_payment_info(p_account_id uuid)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_owner_id uuid;
  v_profile RECORD;
  v_banking RECORD;
BEGIN
  -- First verify the requesting user has access to this account
  SELECT owner_id INTO v_owner_id
  FROM accounts
  WHERE id = p_account_id 
    AND (owner_id = auth.uid() OR EXISTS (
      SELECT 1 FROM account_participants 
      WHERE account_id = p_account_id AND participant_id = auth.uid()
    ));
  
  IF v_owner_id IS NULL THEN
    RETURN json_build_object('error', 'Access denied');
  END IF;
  
  -- Get owner's basic profile information
  SELECT name, email INTO v_profile
  FROM profiles
  WHERE id = v_owner_id;
  
  IF v_profile IS NULL THEN
    RETURN json_build_object('error', 'Owner profile not found');
  END IF;
  
  -- Get owner's banking information (only if requesting user is the owner)
  IF auth.uid() = v_owner_id THEN
    SELECT bank_name, account_type, account_number, bank_email INTO v_banking
    FROM banking_details
    WHERE user_id = v_owner_id;
  END IF;
  
  -- Return payment info with banking details only for owner
  RETURN json_build_object(
    'name', COALESCE(v_profile.name, 'Usuario'),
    'email', COALESCE(v_profile.email, 'usuario@email.com'),
    'bank_name', COALESCE(v_banking.bank_name, NULL),
    'account_type', COALESCE(v_banking.account_type, NULL),
    'account_number', COALESCE(v_banking.account_number, NULL),
    'bank_email', COALESCE(v_banking.bank_email, NULL)
  );
END;
$function$;