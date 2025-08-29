-- Fix the account_participants record for lubarzam@gmail.com in the new account
UPDATE public.account_participants 
SET 
  participant_id = '6df8dde6-7108-4999-9d0e-213ca8a3df19',
  is_registered = true
WHERE email = 'lubarzam@gmail.com' 
  AND participant_id IS NULL 
  AND account_id = '09deb102-c334-49d8-9e77-db82274b95c7';