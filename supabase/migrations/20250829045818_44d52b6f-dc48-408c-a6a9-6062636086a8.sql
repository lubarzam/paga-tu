-- Fix RLS policy for accounts - users should see accounts where they are participants
DROP POLICY IF EXISTS "Users can view accounts they own or participate in" ON public.accounts;

CREATE POLICY "Users can view accounts they own or participate in" 
ON public.accounts 
FOR SELECT 
USING (
  auth.uid() = owner_id 
  OR 
  EXISTS (
    SELECT 1 
    FROM public.account_participants 
    WHERE account_participants.account_id = accounts.id 
    AND account_participants.participant_id = auth.uid()
  )
);