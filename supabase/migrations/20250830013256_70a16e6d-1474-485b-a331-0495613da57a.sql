-- Security hardening: Restrict RPC function privileges
-- Only authenticated users should be able to execute these functions

REVOKE EXECUTE ON FUNCTION public.send_invitation_email(uuid, text, text) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.send_invitation_email(uuid, text, text) FROM anon;
GRANT EXECUTE ON FUNCTION public.send_invitation_email(uuid, text, text) TO authenticated;

REVOKE EXECUTE ON FUNCTION public.accept_invitation(text) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.accept_invitation(text) FROM anon;
GRANT EXECUTE ON FUNCTION public.accept_invitation(text) TO authenticated;

REVOKE EXECUTE ON FUNCTION public.calculate_participant_totals(uuid) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.calculate_participant_totals(uuid) FROM anon;
GRANT EXECUTE ON FUNCTION public.calculate_participant_totals(uuid) TO authenticated;

REVOKE EXECUTE ON FUNCTION public.link_registered_participants(uuid) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.link_registered_participants(uuid) FROM anon;
GRANT EXECUTE ON FUNCTION public.link_registered_participants(uuid) TO authenticated;

REVOKE EXECUTE ON FUNCTION public.get_participant_basic_info(uuid) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.get_participant_basic_info(uuid) FROM anon;
GRANT EXECUTE ON FUNCTION public.get_participant_basic_info(uuid) TO authenticated;

REVOKE EXECUTE ON FUNCTION public.create_temporary_profile(text, text) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.create_temporary_profile(text, text) FROM anon;
GRANT EXECUTE ON FUNCTION public.create_temporary_profile(text, text) TO authenticated;

-- Update get_owner_payment_info to use banking_details table
CREATE OR REPLACE FUNCTION public.get_owner_payment_info(p_account_id uuid)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_owner_id uuid;
  v_profile RECORD;
  v_banking RECORD;
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
  
  -- Get owner's basic information
  SELECT name, email INTO v_profile
  FROM profiles
  WHERE id = v_owner_id;
  
  IF v_profile IS NULL THEN
    RETURN json_build_object('error', 'Owner profile not found');
  END IF;
  
  -- Get owner's banking information
  SELECT bank_name, account_type, account_number, bank_email INTO v_banking
  FROM banking_details
  WHERE user_id = v_owner_id;
  
  -- Return safe payment info (only what's needed for reminders)
  RETURN json_build_object(
    'name', COALESCE(v_profile.name, 'Usuario'),
    'email', COALESCE(v_profile.email, 'usuario@email.com'),
    'bank_name', v_banking.bank_name,
    'account_type', v_banking.account_type,
    'account_number', v_banking.account_number,
    'bank_email', v_banking.bank_email
  );
END;
$function$;

REVOKE EXECUTE ON FUNCTION public.get_owner_payment_info(uuid) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.get_owner_payment_info(uuid) FROM anon;
GRANT EXECUTE ON FUNCTION public.get_owner_payment_info(uuid) TO authenticated;

-- Create safer contact search function
CREATE OR REPLACE FUNCTION public.search_frequent_contacts(q text)
RETURNS TABLE(id uuid, name text, email text, usage_count integer, last_used_at timestamp with time zone)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  SELECT fc.id, fc.name, fc.email, fc.usage_count, fc.last_used_at
  FROM frequent_contacts fc
  WHERE fc.user_id = auth.uid()
    AND (fc.name ILIKE '%' || q || '%' OR fc.email ILIKE '%' || q || '%')
  ORDER BY fc.usage_count DESC, fc.last_used_at DESC
  LIMIT 5;
$function$;

REVOKE EXECUTE ON FUNCTION public.search_frequent_contacts(text) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.search_frequent_contacts(text) FROM anon;
GRANT EXECUTE ON FUNCTION public.search_frequent_contacts(text) TO authenticated;

-- Clean up duplicate RLS policies on profiles
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;

-- Ensure handle_new_user trigger exists (this should already exist but let's be safe)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();