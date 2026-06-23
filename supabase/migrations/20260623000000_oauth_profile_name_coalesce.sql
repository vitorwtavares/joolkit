-- OAuth providers store the user's display name under different metadata keys
-- than email/password signup (which sends 'full_name'). Google populates both
-- 'full_name' and 'name'; other providers (e.g. LinkedIn OIDC) only set 'name'.
-- Coalesce across the known keys so OAuth signups seed a profile name instead
-- of NULL. Same one-time copy semantics as before: see
-- 20260601000000_seed_profile_name_from_metadata.sql.
CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
  INSERT INTO public.profiles (id, email, name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(
      NEW.raw_user_meta_data->>'full_name',
      NEW.raw_user_meta_data->>'name'
    )
  );
  RETURN NEW;
END;
$function$;
