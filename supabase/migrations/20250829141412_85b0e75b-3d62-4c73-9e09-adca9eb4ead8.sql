-- Fix calculate_participant_totals function to correctly reference participant IDs
CREATE OR REPLACE FUNCTION public.calculate_participant_totals(p_account_id uuid)
 RETURNS json
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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
    
    -- Calculate person's subtotal from items they participate in
    -- item_participants.participant_id should reference account_participants.id
    FOR item IN
      SELECT 
        ai.amount, 
        COUNT(ip.participant_id) as participant_count
      FROM public.account_items ai
      JOIN public.item_participants ip ON ai.id = ip.item_id
      WHERE ai.account_id = p_account_id
        AND ip.participant_id = participant.id  -- Use account_participants.id
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
$function$;