-- Remove the overly permissive public policy that exposes all user data
DROP POLICY "Public profiles are viewable by everyone" ON public.profiles;

-- Create secure access control policies
-- Policy 1: Users can view their own profile
CREATE POLICY "Users can view their own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

-- Policy 2: Users can view profiles of people they share accounts with
CREATE POLICY "Users can view profiles of account co-participants" ON public.profiles
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.account_participants ap1
      JOIN public.account_participants ap2 ON ap1.account_id = ap2.account_id
      WHERE ap1.participant_id = auth.uid() 
        AND ap2.participant_id = profiles.id
    )
  );

-- Policy 3: Account owners can view profiles of their participants
CREATE POLICY "Account owners can view participant profiles" ON public.profiles
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.accounts a
      JOIN public.account_participants ap ON a.id = ap.account_id
      WHERE a.owner_id = auth.uid() 
        AND ap.participant_id = profiles.id
    )
  );