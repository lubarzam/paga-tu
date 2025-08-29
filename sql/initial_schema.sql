-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create profiles table (extends auth.users)
CREATE TABLE public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT NOT NULL,
  name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create accounts table
CREATE TABLE public.accounts (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  owner_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  subtotal DECIMAL(10,2) NOT NULL DEFAULT 0,
  tip_amount DECIMAL(10,2) DEFAULT 0,
  tip_included BOOLEAN DEFAULT false,
  total DECIMAL(10,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create account_items table
CREATE TABLE public.account_items (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  account_id UUID REFERENCES public.accounts(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create account_participants table (many-to-many between accounts and profiles)
CREATE TABLE public.account_participants (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  account_id UUID REFERENCES public.accounts(id) ON DELETE CASCADE NOT NULL,
  participant_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  email TEXT NOT NULL, -- Para invitados que aún no tienen cuenta
  name TEXT,
  is_registered BOOLEAN DEFAULT false, -- true si tiene cuenta, false si es invitado
  total_amount DECIMAL(10,2) DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(account_id, participant_id),
  UNIQUE(account_id, email)
);

-- Create item_participants table (many-to-many between items and participants)
CREATE TABLE public.item_participants (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  item_id UUID REFERENCES public.account_items(id) ON DELETE CASCADE NOT NULL,
  participant_id UUID REFERENCES public.account_participants(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(item_id, participant_id)
);

-- Create invitations table
CREATE TABLE public.invitations (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  account_id UUID REFERENCES public.accounts(id) ON DELETE CASCADE NOT NULL,
  email TEXT NOT NULL,
  name TEXT,
  invited_by UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined')),
  token TEXT UNIQUE NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '7 days'),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.account_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.account_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.item_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invitations ENABLE ROW LEVEL SECURITY;

-- RLS Policies for profiles
CREATE POLICY "Public profiles are viewable by everyone" ON public.profiles
  FOR SELECT USING (true);

CREATE POLICY "Users can insert their own profile" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

-- RLS Policies for accounts
CREATE POLICY "Users can view accounts they own or participate in" ON public.accounts
  FOR SELECT USING (
    auth.uid() = owner_id OR 
    EXISTS (
      SELECT 1 FROM public.account_participants 
      WHERE account_id = id AND participant_id = auth.uid()
    )
  );

CREATE POLICY "Users can create their own accounts" ON public.accounts
  FOR INSERT WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Users can update their own accounts" ON public.accounts
  FOR UPDATE USING (auth.uid() = owner_id);

CREATE POLICY "Users can delete their own accounts" ON public.accounts
  FOR DELETE USING (auth.uid() = owner_id);

-- RLS Policies for account_items
CREATE POLICY "Users can view items from accounts they have access to" ON public.account_items
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.accounts 
      WHERE id = account_id AND (
        owner_id = auth.uid() OR 
        EXISTS (
          SELECT 1 FROM public.account_participants 
          WHERE account_id = accounts.id AND participant_id = auth.uid()
        )
      )
    )
  );

CREATE POLICY "Account owners can manage items" ON public.account_items
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.accounts 
      WHERE id = account_id AND owner_id = auth.uid()
    )
  );

-- RLS Policies for account_participants
CREATE POLICY "Users can view participants from accounts they have access to" ON public.account_participants
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.accounts 
      WHERE id = account_id AND (
        owner_id = auth.uid() OR 
        EXISTS (
          SELECT 1 FROM public.account_participants ap2
          WHERE ap2.account_id = accounts.id AND ap2.participant_id = auth.uid()
        )
      )
    )
  );

CREATE POLICY "Account owners can manage participants" ON public.account_participants
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.accounts 
      WHERE id = account_id AND owner_id = auth.uid()
    )
  );

-- RLS Policies for item_participants
CREATE POLICY "Users can view item participants from accounts they have access to" ON public.item_participants
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.account_items ai
      JOIN public.accounts a ON ai.account_id = a.id
      WHERE ai.id = item_id AND (
        a.owner_id = auth.uid() OR 
        EXISTS (
          SELECT 1 FROM public.account_participants 
          WHERE account_id = a.id AND participant_id = auth.uid()
        )
      )
    )
  );

CREATE POLICY "Account owners can manage item participants" ON public.item_participants
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.account_items ai
      JOIN public.accounts a ON ai.account_id = a.id
      WHERE ai.id = item_id AND a.owner_id = auth.uid()
    )
  );

-- RLS Policies for invitations
CREATE POLICY "Users can view invitations they sent or received" ON public.invitations
  FOR SELECT USING (
    auth.uid() = invited_by OR 
    auth.email() = email
  );

CREATE POLICY "Users can create invitations for their accounts" ON public.invitations
  FOR INSERT WITH CHECK (
    auth.uid() = invited_by AND
    EXISTS (
      SELECT 1 FROM public.accounts 
      WHERE id = account_id AND owner_id = auth.uid()
    )
  );

CREATE POLICY "Users can update invitations they received" ON public.invitations
  FOR UPDATE USING (auth.email() = email);

-- Create functions and triggers for updated_at
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER handle_updated_at_profiles
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER handle_updated_at_accounts
  BEFORE UPDATE ON public.accounts
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Function to handle new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, name, avatar_url)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', NEW.raw_user_meta_data->>'full_name'),
    NEW.raw_user_meta_data->>'avatar_url'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for new user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();