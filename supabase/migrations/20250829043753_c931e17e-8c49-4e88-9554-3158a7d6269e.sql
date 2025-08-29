-- Fix the account_participants records for lhbarrientosz@gmail.com
UPDATE public.account_participants 
SET 
  participant_id = 'cad1b544-e7ac-4dd5-9662-9fcbdab617d1',
  is_registered = true
WHERE email = 'lhbarrientosz@gmail.com' 
  AND participant_id IS NULL;