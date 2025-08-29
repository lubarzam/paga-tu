-- Add foreign key constraint between account_participants and profiles
ALTER TABLE public.account_participants 
ADD CONSTRAINT fk_account_participants_profiles 
FOREIGN KEY (participant_id) 
REFERENCES public.profiles(id) 
ON DELETE SET NULL;