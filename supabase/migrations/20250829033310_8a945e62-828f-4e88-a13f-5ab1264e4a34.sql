-- Add paid column to account_participants table
ALTER TABLE public.account_participants 
ADD COLUMN paid BOOLEAN DEFAULT false;