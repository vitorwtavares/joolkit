-- Seed the quick-copy profile name from the signup metadata (full_name) as a
-- convenience. This is a one-time copy at account creation, not a link: the
-- canonical user-identity name lives in auth.users.raw_user_meta_data, while
-- public.profiles.name is the independently editable quick-copy value.
CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
  INSERT INTO public.profiles (id, email, name)
  VALUES (NEW.id, NEW.email, NEW.raw_user_meta_data->>'full_name');
  RETURN NEW;
END;
$function$;
