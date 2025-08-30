-- Fix the handle_new_user trigger to properly link participants
-- First, let's check if we have any pending participants that need linking
DO $$
DECLARE
    participant_record RECORD;
BEGIN
    -- Link any existing unlinked participants to registered users
    FOR participant_record IN 
        SELECT DISTINCT ap.email 
        FROM account_participants ap 
        WHERE ap.participant_id IS NULL 
        AND ap.is_registered = false
        AND EXISTS (
            SELECT 1 FROM profiles p 
            WHERE p.email = ap.email 
            AND p.id IS NOT NULL
        )
    LOOP
        -- Update participants to link with registered user
        UPDATE account_participants 
        SET 
            participant_id = (SELECT id FROM profiles WHERE email = participant_record.email AND id IS NOT NULL),
            is_registered = true
        WHERE email = participant_record.email 
        AND participant_id IS NULL;
        
        RAISE NOTICE 'Linked participant with email: %', participant_record.email;
    END LOOP;
END $$;

-- Improve the handle_new_user function to be more robust
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- Check if a profile already exists for this email (from invitations)
  IF EXISTS (
    SELECT 1 FROM profiles 
    WHERE email = NEW.email AND id IS NULL
  ) THEN
    -- Update the existing profile with the new user ID
    UPDATE profiles 
    SET 
      id = NEW.id,
      updated_at = now()
    WHERE email = NEW.email AND id IS NULL;
    
    -- Update account_participants to link the participant_id
    UPDATE account_participants 
    SET 
      participant_id = NEW.id,
      is_registered = true
    WHERE email = NEW.email AND (participant_id IS NULL OR is_registered = false);
    
    RAISE NOTICE 'Updated existing profile and participants for email: %', NEW.email;
  ELSE
    -- Create a new profile for registered users who don't have one
    INSERT INTO profiles (id, email, name)
    VALUES (
      NEW.id, 
      NEW.email,
      COALESCE(NEW.raw_user_meta_data->>'name', NEW.raw_user_meta_data->>'full_name')
    );
    
    -- Also link any existing participants with this email
    UPDATE account_participants 
    SET 
      participant_id = NEW.id,
      is_registered = true
    WHERE email = NEW.email AND participant_id IS NULL;
    
    RAISE NOTICE 'Created new profile and linked participants for email: %', NEW.email;
  END IF;
  
  RETURN NEW;
END;
$function$;