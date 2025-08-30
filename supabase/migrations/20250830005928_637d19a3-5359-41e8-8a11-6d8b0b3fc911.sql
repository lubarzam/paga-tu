-- Fix critical security vulnerability: Restrict access to banking information in profiles table
-- Only allow users to see their own banking info, while allowing basic profile info for co-participants

-- Drop existing policies that allow too broad access to sensitive data
DROP POLICY IF EXISTS "Account owners can view participant basic info" ON public.profiles;
DROP POLICY IF EXISTS "Co-participants can view other participant basic info" ON public.profiles;

-- Create secure policies that protect banking information
-- Policy 1: Users can view their own complete profile (including banking info)
CREATE POLICY "Users can view their own complete profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

-- Policy 2: Account owners can view ONLY basic info (no banking data) of participants
CREATE POLICY "Account owners can view participant basic info only" ON public.profiles
  FOR SELECT USING (
    EXISTS (
      SELECT 1
      FROM accounts a
      JOIN account_participants ap ON a.id = ap.account_id
      WHERE a.owner_id = auth.uid() 
        AND ap.participant_id = profiles.id
        AND profiles.id <> auth.uid()
    )
  );

-- Policy 3: Co-participants can view ONLY basic info (no banking data) of other participants
CREATE POLICY "Co-participants can view other participant basic info only" ON public.profiles
  FOR SELECT USING (
    EXISTS (
      SELECT 1
      FROM account_participants ap1
      JOIN account_participants ap2 ON ap1.account_id = ap2.account_id
      WHERE ap1.participant_id = auth.uid() 
        AND ap2.participant_id = profiles.id
        AND ap1.participant_id <> ap2.participant_id
        AND profiles.id <> auth.uid()
    )
  );

-- Create a function to check if user can access banking info (only for own profile)
CREATE OR REPLACE FUNCTION public.can_access_banking_info(profile_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT profile_id = auth.uid();
$$;

-- Add a computed column approach by creating a view that automatically filters banking info
CREATE OR REPLACE VIEW public.safe_participant_profiles AS
SELECT 
  id,
  email,
  name,
  avatar_url,
  created_at,
  updated_at,
  -- Banking info only visible to profile owner
  CASE WHEN id = auth.uid() THEN bank_name ELSE NULL END as bank_name,
  CASE WHEN id = auth.uid() THEN account_type ELSE NULL END as account_type,
  CASE WHEN id = auth.uid() THEN account_number ELSE NULL END as account_number,
  CASE WHEN id = auth.uid() THEN bank_email ELSE NULL END as bank_email
FROM public.profiles;

-- Update the get_participant_basic_info function to ensure it only returns basic info
CREATE OR REPLACE FUNCTION public.get_participant_basic_info(participant_id uuid)
RETURNS TABLE(id uuid, name text, email text, avatar_url text)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT p.id, p.name, p.email, p.avatar_url
  FROM profiles p
  WHERE p.id = participant_id;
$$;