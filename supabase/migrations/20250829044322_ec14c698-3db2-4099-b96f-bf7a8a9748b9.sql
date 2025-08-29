-- Link registered participants to account_participants by email
CREATE OR REPLACE FUNCTION public.link_registered_participants(p_account_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  UPDATE public.account_participants ap
  SET 
    participant_id = p.id,
    is_registered = true
  FROM public.profiles p
  WHERE ap.account_id = p_account_id
    AND ap.email = p.email
    AND (ap.participant_id IS NULL OR ap.participant_id <> p.id);
END;
$$;