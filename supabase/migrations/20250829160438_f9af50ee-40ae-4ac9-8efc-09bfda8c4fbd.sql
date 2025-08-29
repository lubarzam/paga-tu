-- Fix infinite recursion in account_participants policy and allow co-participant visibility safely

-- 1) Create a SECURITY DEFINER helper to check if current user participates in an account
CREATE OR REPLACE FUNCTION public.is_account_co_participant(_account_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.account_participants ap
    WHERE ap.account_id = _account_id
      AND ap.participant_id = auth.uid()
  );
$$;

-- 2) Drop the recursion-causing policy (if exists)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public'
      AND tablename = 'account_participants'
      AND policyname = 'Participants can view all participants in their account'
  ) THEN
    DROP POLICY "Participants can view all participants in their account" ON public.account_participants;
  END IF;
END $$;

-- 3) Replace existing SELECT policy with a single safe policy that also allows co-participants
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public'
      AND tablename = 'account_participants'
      AND policyname = 'Users can view participants from accessible accounts'
  ) THEN
    DROP POLICY "Users can view participants from accessible accounts" ON public.account_participants;
  END IF;

  CREATE POLICY "Users can view participants (owners, self, or co-participants)"
  ON public.account_participants
  FOR SELECT
  USING (
    user_has_account_access(account_id, auth.uid())
    OR participant_id = auth.uid()
    OR public.is_account_co_participant(account_id)
  );
END $$;
