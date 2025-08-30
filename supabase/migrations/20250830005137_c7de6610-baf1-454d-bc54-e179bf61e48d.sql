-- Fix SECURITY DEFINER functions to use immutable search paths
-- This prevents search_path injection attacks

-- Drop and recreate functions with proper security
DROP FUNCTION IF EXISTS public.link_registered_participants(uuid);
DROP FUNCTION IF EXISTS public.calculate_participant_totals(uuid);

-- Recreate with immutable search_path = 'public'
CREATE OR REPLACE FUNCTION public.link_registered_participants(p_account_id uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = 'public'
AS $function$
BEGIN
  UPDATE account_participants ap
  SET 
    participant_id = p.id,
    is_registered = true
  FROM profiles p
  WHERE ap.account_id = p_account_id
    AND ap.email = p.email
    AND (ap.participant_id IS NULL OR ap.participant_id <> p.id);
END;
$function$;

CREATE OR REPLACE FUNCTION public.calculate_participant_totals(p_account_id uuid)
 RETURNS json
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = 'public'
AS $function$
DECLARE
  participant RECORD;
  v_subtotal DECIMAL(10,2);
  v_tip_amount DECIMAL(10,2);
  v_person_subtotal DECIMAL(10,2);
  v_person_tip DECIMAL(10,2);
  v_person_total DECIMAL(10,2);
BEGIN
  -- Get account totals
  SELECT subtotal, tip_amount INTO v_subtotal, v_tip_amount
  FROM accounts
  WHERE id = p_account_id;

  -- Update each participant's total
  FOR participant IN 
    SELECT id FROM account_participants 
    WHERE account_id = p_account_id
  LOOP
    -- Calculate person's subtotal as the sum of each item's share
    SELECT COALESCE(SUM(ai.amount / counts.participant_count), 0)
    INTO v_person_subtotal
    FROM account_items ai
    JOIN (
      SELECT ip.item_id, COUNT(*) AS participant_count
      FROM item_participants ip
      GROUP BY ip.item_id
    ) counts ON counts.item_id = ai.id
    WHERE ai.account_id = p_account_id
      AND EXISTS (
        SELECT 1 
        FROM item_participants ip2 
        WHERE ip2.item_id = ai.id 
          AND ip2.participant_id = participant.id
      );
    
    -- Proportional tip by subtotal share
    v_person_tip := 0;
    IF v_subtotal > 0 AND v_tip_amount > 0 THEN
      v_person_tip := (v_tip_amount * v_person_subtotal) / v_subtotal;
    END IF;
    
    v_person_total := v_person_subtotal + v_person_tip;
    
    -- Update participant total
    UPDATE account_participants
    SET total_amount = v_person_total
    WHERE id = participant.id;
  END LOOP;
  
  RETURN json_build_object('success', true);
EXCEPTION WHEN OTHERS THEN
  RETURN json_build_object('success', false, 'error', SQLERRM);
END;
$function$;

-- Create a secure function to get owner payment info for reminders
-- This ensures only authorized users can access banking details
CREATE OR REPLACE FUNCTION public.get_owner_payment_info(p_account_id uuid)
 RETURNS json
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = 'public'
AS $function$
DECLARE
  v_owner_id uuid;
  v_profile RECORD;
BEGIN
  -- First verify the requesting user has access to this account
  SELECT owner_id INTO v_owner_id
  FROM accounts
  WHERE id = p_account_id 
    AND (owner_id = auth.uid() OR EXISTS (
      SELECT 1 FROM account_participants 
      WHERE account_id = p_account_id AND participant_id = auth.uid()
    ));
  
  IF v_owner_id IS NULL THEN
    RETURN json_build_object('error', 'Access denied');
  END IF;
  
  -- Get owner's payment information
  SELECT name, email, bank_name, account_type, account_number, bank_email
  INTO v_profile
  FROM profiles
  WHERE id = v_owner_id;
  
  IF v_profile IS NULL THEN
    RETURN json_build_object('error', 'Owner profile not found');
  END IF;
  
  -- Return safe payment info (only what's needed for reminders)
  RETURN json_build_object(
    'name', COALESCE(v_profile.name, 'Usuario'),
    'email', COALESCE(v_profile.email, 'usuario@email.com'),
    'bank_name', v_profile.bank_name,
    'account_type', v_profile.account_type,
    'account_number', v_profile.account_number,
    'bank_email', v_profile.bank_email
  );
END;
$function$;