-- Fix participant totals calculation to use total participants per item, and allow co-participants visibility

-- 1) Replace calculate_participant_totals with correct logic
CREATE OR REPLACE FUNCTION public.calculate_participant_totals(p_account_id uuid)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
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
  FROM public.accounts
  WHERE id = p_account_id;

  -- Update each participant's total
  FOR participant IN 
    SELECT id FROM public.account_participants 
    WHERE account_id = p_account_id
  LOOP
    -- Calculate person's subtotal as the sum of each item's share
    SELECT COALESCE(SUM(ai.amount / counts.participant_count), 0)
    INTO v_person_subtotal
    FROM public.account_items ai
    JOIN (
      SELECT ip.item_id, COUNT(*) AS participant_count
      FROM public.item_participants ip
      GROUP BY ip.item_id
    ) counts ON counts.item_id = ai.id
    WHERE ai.account_id = p_account_id
      AND EXISTS (
        SELECT 1 
        FROM public.item_participants ip2 
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
    UPDATE public.account_participants
    SET total_amount = v_person_total
    WHERE id = participant.id;
  END LOOP;
  
  RETURN json_build_object('success', true);
EXCEPTION WHEN OTHERS THEN
  RETURN json_build_object('success', false, 'error', SQLERRM);
END;
$function$;

-- 2) Allow participants to view all co-participants in their accounts
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
      AND tablename = 'account_participants' 
      AND policyname = 'Participants can view all participants in their account'
  ) THEN
    CREATE POLICY "Participants can view all participants in their account"
    ON public.account_participants
    FOR SELECT
    USING (
      EXISTS (
        SELECT 1
        FROM public.account_participants ap2
        WHERE ap2.account_id = account_participants.account_id
          AND ap2.participant_id = auth.uid()
      )
    );
  END IF;
END $$;

-- 3) Recalculate totals for existing accounts so UI reflects the fix immediately
DO $$
DECLARE r RECORD;
BEGIN
  FOR r IN SELECT id FROM public.accounts LOOP
    PERFORM public.calculate_participant_totals(r.id);
  END LOOP;
END $$;
