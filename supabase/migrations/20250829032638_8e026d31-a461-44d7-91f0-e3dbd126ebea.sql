-- Drop the problematic recursive policies on account_participants
DROP POLICY "Users can view participants from accounts they have access to" ON public.account_participants;
DROP POLICY "Account owners can manage participants" ON public.account_participants;

-- Create a security definer function to check if user has access to an account
CREATE OR REPLACE FUNCTION public.user_has_account_access(_account_id uuid, _user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.accounts 
    WHERE id = _account_id AND owner_id = _user_id
  );
$$;

-- Create new safe policies for account_participants
CREATE POLICY "Users can view participants from accessible accounts" ON public.account_participants
  FOR SELECT USING (
    public.user_has_account_access(account_id, auth.uid()) OR 
    participant_id = auth.uid()
  );

CREATE POLICY "Account owners can manage participants" ON public.account_participants
  FOR ALL USING (
    public.user_has_account_access(account_id, auth.uid())
  );