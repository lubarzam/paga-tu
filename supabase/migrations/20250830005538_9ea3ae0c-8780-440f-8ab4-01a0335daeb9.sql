-- Fix the remaining functions with mutable search paths
-- These appear to be the non-security-definer functions

CREATE OR REPLACE FUNCTION public.user_has_account_access(_account_id uuid, _user_id uuid)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path = 'public'
AS $function$
  SELECT EXISTS (
    SELECT 1 FROM accounts 
    WHERE id = _account_id AND owner_id = _user_id
  );
$function$;

CREATE OR REPLACE FUNCTION public.is_account_co_participant(_account_id uuid)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path = 'public'
AS $function$
  SELECT EXISTS (
    SELECT 1
    FROM account_participants ap
    WHERE ap.account_id = _account_id
      AND ap.participant_id = auth.uid()
  );
$function$;

CREATE OR REPLACE FUNCTION public.get_participant_basic_info(participant_id uuid)
 RETURNS TABLE(id uuid, name text, email text, avatar_url text)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path = 'public'
AS $function$
  SELECT p.id, p.name, p.email, p.avatar_url
  FROM profiles p
  WHERE p.id = participant_id;
$function$;