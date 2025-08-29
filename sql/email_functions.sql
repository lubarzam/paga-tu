-- Function to send invitation emails
CREATE OR REPLACE FUNCTION public.send_invitation_email(
  p_account_id UUID,
  p_email TEXT,
  p_name TEXT DEFAULT NULL
) RETURNS JSON AS $$
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
  FROM public.accounts a
  JOIN public.profiles p ON a.owner_id = p.id
  WHERE a.id = p_account_id AND a.owner_id = auth.uid();
  
  IF v_account_name IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Account not found or access denied');
  END IF;
  
  -- Create invitation record
  INSERT INTO public.invitations (account_id, email, name, invited_by, token)
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to accept invitation
CREATE OR REPLACE FUNCTION public.accept_invitation(p_token TEXT)
RETURNS JSON AS $$
DECLARE
  v_invitation RECORD;
  v_participant_id UUID;
BEGIN
  -- Get invitation details
  SELECT * INTO v_invitation
  FROM public.invitations
  WHERE token = p_token 
    AND status = 'pending' 
    AND expires_at > NOW()
    AND email = auth.email();
  
  IF v_invitation IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Invalid or expired invitation');
  END IF;
  
  -- Check if user is already a participant
  SELECT id INTO v_participant_id
  FROM public.account_participants
  WHERE account_id = v_invitation.account_id 
    AND (participant_id = auth.uid() OR email = auth.email());
  
  IF v_participant_id IS NOT NULL THEN
    -- Update existing participant to registered
    UPDATE public.account_participants
    SET participant_id = auth.uid(), is_registered = true
    WHERE id = v_participant_id;
  ELSE
    -- Create new participant
    INSERT INTO public.account_participants (account_id, participant_id, email, name, is_registered)
    VALUES (v_invitation.account_id, auth.uid(), auth.email(), v_invitation.name, true);
  END IF;
  
  -- Update invitation status
  UPDATE public.invitations
  SET status = 'accepted'
  WHERE id = v_invitation.id;
  
  RETURN json_build_object('success', true, 'account_id', v_invitation.account_id);
  
EXCEPTION WHEN OTHERS THEN
  RETURN json_build_object('success', false, 'error', SQLERRM);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to calculate and update participant totals
CREATE OR REPLACE FUNCTION public.calculate_participant_totals(p_account_id UUID)
RETURNS JSON AS $$
DECLARE
  participant RECORD;
  item RECORD;
  v_subtotal DECIMAL(10,2);
  v_tip_amount DECIMAL(10,2);
  v_person_subtotal DECIMAL(10,2);
  v_person_tip DECIMAL(10,2);
  v_person_total DECIMAL(10,2);
BEGIN
  -- Get account totals
  SELECT subtotal, tip_amount INTO v_subtotal, v_tip_amount
  FROM public.accounts
  WHERE id = p_account_id;
  
  -- Update each participant's total
  FOR participant IN 
    SELECT id, participant_id, email FROM public.account_participants 
    WHERE account_id = p_account_id
  LOOP
    v_person_subtotal := 0;
    
    -- Calculate person's subtotal from items
    FOR item IN
      SELECT ai.amount, COUNT(ip.participant_id) as participant_count
      FROM public.account_items ai
      JOIN public.item_participants ip ON ai.id = ip.item_id
      WHERE ai.account_id = p_account_id
        AND ip.participant_id = participant.id
      GROUP BY ai.id, ai.amount
    LOOP
      v_person_subtotal := v_person_subtotal + (item.amount / item.participant_count);
    END LOOP;
    
    -- Calculate proportional tip
    v_person_tip := 0;
    IF v_subtotal > 0 AND v_tip_amount > 0 THEN
      v_person_tip := (v_tip_amount * v_person_subtotal) / v_subtotal;
    END IF;
    
    v_person_total := v_person_subtotal + v_person_tip;
    
    -- Update participant total
    UPDATE public.account_participants
    SET total_amount = v_person_total
    WHERE id = participant.id;
  END LOOP;
  
  RETURN json_build_object('success', true);
  
EXCEPTION WHEN OTHERS THEN
  RETURN json_build_object('success', false, 'error', SQLERRM);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;