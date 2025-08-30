-- Fix remaining SECURITY DEFINER functions with mutable search paths
-- This completes the security hardening by setting immutable search_path = 'public'

-- Fix handle_new_user function
DROP FUNCTION IF EXISTS public.handle_new_user();
CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = 'public'
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
    WHERE email = NEW.email AND participant_id IS NULL;
  ELSE
    -- Create a new profile for registered users who don't have one
    INSERT INTO profiles (id, email, name)
    VALUES (
      NEW.id, 
      NEW.email,
      COALESCE(NEW.raw_user_meta_data->>'name', NEW.raw_user_meta_data->>'full_name')
    );
  END IF;
  
  RETURN NEW;
END;
$function$;

-- Fix send_invitation_email function
DROP FUNCTION IF EXISTS public.send_invitation_email(uuid, text, text);
CREATE OR REPLACE FUNCTION public.send_invitation_email(p_account_id uuid, p_email text, p_name text DEFAULT NULL::text)
 RETURNS json
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = 'public'
AS $function$
DECLARE
  v_account_name TEXT;
  v_owner_name TEXT;
  v_token TEXT;
  v_invitation_id UUID;
  v_result JSON;
BEGIN
  -- Generate unique token
  v_token := encode(gen_random_bytes(32), 'hex');
  
  -- Get account and owner information
  SELECT a.name, p.name 
  INTO v_account_name, v_owner_name
  FROM accounts a
  JOIN profiles p ON a.owner_id = p.id
  WHERE a.id = p_account_id AND a.owner_id = auth.uid();
  
  IF v_account_name IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Account not found or access denied');
  END IF;
  
  -- Create invitation record
  INSERT INTO invitations (account_id, email, name, invited_by, token)
  VALUES (p_account_id, p_email, p_name, auth.uid(), v_token)
  RETURNING id INTO v_invitation_id;
  
  -- Send email using Supabase Edge Function
  SELECT 
    extensions.http((
      'POST',
      current_setting('app.settings.edge_function_url') || '/send-invitation-email',
      ARRAY[
        extensions.http_header('Content-Type', 'application/json'),
        extensions.http_header('Authorization', 'Bearer ' || current_setting('app.settings.service_role_key'))
      ],
      json_build_object(
        'to', p_email,
        'invitee_name', COALESCE(p_name, 'Invitado'),
        'account_name', v_account_name,
        'inviter_name', v_owner_name,
        'invitation_token', v_token
      )::text
    )) INTO v_result;
  
  RETURN json_build_object(
    'success', true, 
    'invitation_id', v_invitation_id,
    'token', v_token
  );
  
EXCEPTION WHEN OTHERS THEN
  RETURN json_build_object('success', false, 'error', SQLERRM);
END;
$function$;

-- Fix accept_invitation function
DROP FUNCTION IF EXISTS public.accept_invitation(text);
CREATE OR REPLACE FUNCTION public.accept_invitation(p_token text)
 RETURNS json
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = 'public'
AS $function$
DECLARE
  v_invitation RECORD;
  v_participant_id UUID;
BEGIN
  -- Get invitation details
  SELECT * INTO v_invitation
  FROM invitations
  WHERE token = p_token 
    AND status = 'pending' 
    AND expires_at > NOW()
    AND email = auth.email();
  
  IF v_invitation IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Invalid or expired invitation');
  END IF;
  
  -- Check if user is already a participant
  SELECT id INTO v_participant_id
  FROM account_participants
  WHERE account_id = v_invitation.account_id 
    AND (participant_id = auth.uid() OR email = auth.email());
  
  IF v_participant_id IS NOT NULL THEN
    -- Update existing participant to registered
    UPDATE account_participants
    SET participant_id = auth.uid(), is_registered = true
    WHERE id = v_participant_id;
  ELSE
    -- Create new participant
    INSERT INTO account_participants (account_id, participant_id, email, name, is_registered)
    VALUES (v_invitation.account_id, auth.uid(), auth.email(), v_invitation.name, true);
  END IF;
  
  -- Update invitation status
  UPDATE invitations
  SET status = 'accepted'
  WHERE id = v_invitation.id;
  
  RETURN json_build_object('success', true, 'account_id', v_invitation.account_id);
  
EXCEPTION WHEN OTHERS THEN
  RETURN json_build_object('success', false, 'error', SQLERRM);
END;
$function$;

-- Fix create_temporary_profile function
DROP FUNCTION IF EXISTS public.create_temporary_profile(text, text);
CREATE OR REPLACE FUNCTION public.create_temporary_profile(p_email text, p_name text DEFAULT NULL::text)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = 'public'
AS $function$
DECLARE
  profile_id UUID;
BEGIN
  -- Check if profile already exists
  SELECT id INTO profile_id FROM profiles WHERE email = p_email;
  
  IF profile_id IS NOT NULL THEN
    RETURN profile_id;
  END IF;
  
  -- Create temporary profile with NULL id (will be filled when user registers)
  INSERT INTO profiles (id, email, name, created_at, updated_at)
  VALUES (NULL, p_email, p_name, now(), now())
  RETURNING gen_random_uuid() INTO profile_id;
  
  RETURN profile_id;
END;
$function$;