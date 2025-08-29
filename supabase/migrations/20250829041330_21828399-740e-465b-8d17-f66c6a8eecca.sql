-- Add bank account fields to profiles table
ALTER TABLE public.profiles 
ADD COLUMN bank_name TEXT,
ADD COLUMN account_type TEXT,
ADD COLUMN account_number TEXT,
ADD COLUMN bank_email TEXT;