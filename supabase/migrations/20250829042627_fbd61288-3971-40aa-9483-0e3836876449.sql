-- Create function to handle new user registration and link to existing profiles
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Check if a profile already exists for this email (from invitations)
  IF EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE email = NEW.email AND id IS NULL
  ) THEN
    -- Update the existing profile with the new user ID
    UPDATE public.profiles 
    SET 
      id = NEW.id,
      updated_at = now()
    WHERE email = NEW.email AND id IS NULL;
    
    -- Update account_participants to link the participant_id
    UPDATE public.account_participants 
    SET 
      participant_id = NEW.id,
      is_registered = true
    WHERE email = NEW.email AND participant_id IS NULL;
  ELSE
    -- Create a new profile for registered users who don't have one
    INSERT INTO public.profiles (id, email, name)
    VALUES (
      NEW.id, 
      NEW.email,
      COALESCE(NEW.raw_user_meta_data->>'name', NEW.raw_user_meta_data->>'full_name')
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to handle new user registration
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to create temporary profile for unregistered users
CREATE OR REPLACE FUNCTION public.create_temporary_profile(
  p_email TEXT,
  p_name TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  profile_id UUID;
BEGIN
  -- Check if profile already exists
  SELECT id INTO profile_id FROM public.profiles WHERE email = p_email;
  
  IF profile_id IS NOT NULL THEN
    RETURN profile_id;
  END IF;
  
  -- Create temporary profile with NULL id (will be filled when user registers)
  INSERT INTO public.profiles (id, email, name, created_at, updated_at)
  VALUES (NULL, p_email, p_name, now(), now())
  RETURNING gen_random_uuid() INTO profile_id;
  
  RETURN profile_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;