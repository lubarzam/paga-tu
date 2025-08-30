-- Fix the get_participant_basic_info function with correct column references
CREATE OR REPLACE FUNCTION public.get_participant_basic_info(p_participant_id uuid)
RETURNS TABLE(id uuid, name text, email text, avatar_url text)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  SELECT p.id, p.name, p.email, p.avatar_url
  FROM profiles p
  WHERE p.id = p_participant_id
    AND (
      -- User can view their own info
      auth.uid() = p_participant_id
      OR
      -- Account owners can view their participants' basic info
      EXISTS (
        SELECT 1 FROM accounts a
        JOIN account_participants ap ON a.id = ap.account_id
        WHERE a.owner_id = auth.uid() AND ap.participant_id = p_participant_id
      )
      OR  
      -- Co-participants can view each other's basic info
      EXISTS (
        SELECT 1 FROM account_participants ap1
        JOIN account_participants ap2 ON ap1.account_id = ap2.account_id
        WHERE ap1.participant_id = auth.uid() AND ap2.participant_id = p_participant_id
      )
    );
$function$;