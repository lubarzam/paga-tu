-- Create frequent_contacts table for storing user's frequent invitees
CREATE TABLE public.frequent_contacts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  usage_count INTEGER NOT NULL DEFAULT 1,
  last_used_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, email)
);

-- Enable Row Level Security
ALTER TABLE public.frequent_contacts ENABLE ROW LEVEL SECURITY;

-- Create policies for frequent_contacts
CREATE POLICY "Users can view their own frequent contacts" 
ON public.frequent_contacts 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own frequent contacts" 
ON public.frequent_contacts 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own frequent contacts" 
ON public.frequent_contacts 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own frequent contacts" 
ON public.frequent_contacts 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create index for better performance
CREATE INDEX idx_frequent_contacts_user_id ON public.frequent_contacts(user_id);
CREATE INDEX idx_frequent_contacts_email ON public.frequent_contacts(email);
CREATE INDEX idx_frequent_contacts_usage_count ON public.frequent_contacts(usage_count DESC);