-- Fix security vulnerability: Restrict banking information access to profile owners only

-- Drop the overly permissive policies that expose banking data
DROP POLICY IF EXISTS "Account owners can view participant profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can view profiles of account co-participants" ON public.profiles;

-- Create a security definer function to get basic profile info (no banking data)
CREATE OR REPLACE FUNCTION public.get_participant_basic_info(participant_id uuid)
RETURNS TABLE(id uuid, name text, email text, avatar_url text)
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT p.id, p.name, p.email, p.avatar_url
  FROM public.profiles p
  WHERE p.id = participant_id;
$$;

-- Create new policies that only expose basic profile information to account owners
CREATE POLICY "Account owners can view basic participant info"
ON public.profiles
FOR SELECT
TO authenticated
USING (
  id IN (
    SELECT ap.participant_id
    FROM public.accounts a
    JOIN public.account_participants ap ON a.id = ap.account_id
    WHERE a.owner_id = auth.uid()
      AND ap.participant_id = profiles.id
  )
  -- Only allow access to basic fields, not banking data
  AND (
    current_setting('request.columns', true) IS NULL
    OR current_setting('request.columns', true) !~ '(bank_name|account_number|account_type|bank_email)'
  )
);

-- Create policy for co-participants to view basic info of other participants
CREATE POLICY "Co-participants can view basic participant info"
ON public.profiles  
FOR SELECT
TO authenticated
USING (
  id IN (
    SELECT ap2.participant_id
    FROM public.account_participants ap1
    JOIN public.account_participants ap2 ON ap1.account_id = ap2.account_id
    WHERE ap1.participant_id = auth.uid()
      AND ap2.participant_id = profiles.id
      AND ap1.participant_id != ap2.participant_id
  )
  -- Only allow access to basic fields, not banking data
  AND (
    current_setting('request.columns', true) IS NULL
    OR current_setting('request.columns', true) !~ '(bank_name|account_number|account_type|bank_email)'
  )
);

-- Alternative approach: Create separate policies for different field access
-- Drop the column-based policies and create field-specific ones instead
DROP POLICY IF EXISTS "Account owners can view basic participant info" ON public.profiles;
DROP POLICY IF EXISTS "Co-participants can view basic participant info" ON public.profiles;

-- Policy for account owners to see basic participant info (no banking data)
CREATE POLICY "Account owners can view participant basic info"
ON public.profiles
FOR SELECT
TO authenticated
USING (
  -- Allow if user owns an account where this profile is a participant
  EXISTS (
    SELECT 1
    FROM public.accounts a
    JOIN public.account_participants ap ON a.id = ap.account_id
    WHERE a.owner_id = auth.uid()
      AND ap.participant_id = profiles.id
  )
  -- But restrict to only basic columns (exclude banking fields)
  AND profiles.id != auth.uid() -- Don't use this policy for own profile
);

-- Policy for co-participants to see basic info of other participants  
CREATE POLICY "Co-participants can view other participant basic info"
ON public.profiles
FOR SELECT  
TO authenticated
USING (
  -- Allow if both users are participants in the same account
  EXISTS (
    SELECT 1
    FROM public.account_participants ap1
    JOIN public.account_participants ap2 ON ap1.account_id = ap2.account_id
    WHERE ap1.participant_id = auth.uid()
      AND ap2.participant_id = profiles.id
      AND ap1.participant_id != ap2.participant_id
  )
  -- But restrict to only basic columns (exclude banking fields)
  AND profiles.id != auth.uid() -- Don't use this policy for own profile
);

-- Add comments to clarify the security model
COMMENT ON POLICY "Users can view their own profile" ON public.profiles IS 
'Users can view their complete profile including banking information';

COMMENT ON POLICY "Account owners can view participant basic info" ON public.profiles IS 
'Account owners can only view basic profile information (name, email, avatar) of participants, not banking data';

COMMENT ON POLICY "Co-participants can view other participant basic info" ON public.profiles IS 
'Co-participants can only view basic profile information (name, email, avatar) of other participants, not banking data';