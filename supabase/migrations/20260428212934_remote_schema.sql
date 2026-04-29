drop extension if exists "pg_net";


  create table "public"."answers" (
    "id" uuid not null default gen_random_uuid(),
    "user_id" uuid not null,
    "position" integer not null,
    "question" text not null default ''::text,
    "short_answer" text not null default ''::text,
    "long_answer" text,
    "preferred_variant" text not null default 'short'::text,
    "created_at" timestamp with time zone not null default now(),
    "updated_at" timestamp with time zone not null default now()
      );


alter table "public"."answers" enable row level security;


  create table "public"."cover_letter_templates" (
    "id" uuid not null default gen_random_uuid(),
    "user_id" uuid not null,
    "variation" text not null,
    "file_url" text,
    "content" jsonb,
    "created_at" timestamp with time zone not null default now(),
    "updated_at" timestamp with time zone not null default now()
      );


alter table "public"."cover_letter_templates" enable row level security;


  create table "public"."cover_letter_tokens" (
    "id" uuid not null default gen_random_uuid(),
    "user_id" uuid not null,
    "role" text,
    "company" text,
    "updated_at" timestamp with time zone not null default now()
      );


alter table "public"."cover_letter_tokens" enable row level security;


  create table "public"."profiles" (
    "id" uuid not null,
    "name" text,
    "email" text,
    "phone" text,
    "address" text,
    "linkedin" text,
    "github" text,
    "portfolio" text,
    "other_link" text,
    "resume_url" text,
    "created_at" timestamp with time zone default now(),
    "updated_at" timestamp with time zone default now()
      );


alter table "public"."profiles" enable row level security;

CREATE UNIQUE INDEX answers_pkey ON public.answers USING btree (id);

CREATE UNIQUE INDEX cover_letter_templates_pkey ON public.cover_letter_templates USING btree (id);

CREATE UNIQUE INDEX cover_letter_templates_user_id_variation_key ON public.cover_letter_templates USING btree (user_id, variation);

CREATE UNIQUE INDEX cover_letter_tokens_pkey ON public.cover_letter_tokens USING btree (id);

CREATE UNIQUE INDEX cover_letter_tokens_user_id_key ON public.cover_letter_tokens USING btree (user_id);

CREATE UNIQUE INDEX profiles_pkey ON public.profiles USING btree (id);

alter table "public"."answers" add constraint "answers_pkey" PRIMARY KEY using index "answers_pkey";

alter table "public"."cover_letter_templates" add constraint "cover_letter_templates_pkey" PRIMARY KEY using index "cover_letter_templates_pkey";

alter table "public"."cover_letter_tokens" add constraint "cover_letter_tokens_pkey" PRIMARY KEY using index "cover_letter_tokens_pkey";

alter table "public"."profiles" add constraint "profiles_pkey" PRIMARY KEY using index "profiles_pkey";

alter table "public"."answers" add constraint "answers_user_id_fkey" FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE not valid;

alter table "public"."answers" validate constraint "answers_user_id_fkey";

alter table "public"."cover_letter_templates" add constraint "cover_letter_templates_user_id_fkey" FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE not valid;

alter table "public"."cover_letter_templates" validate constraint "cover_letter_templates_user_id_fkey";

alter table "public"."cover_letter_templates" add constraint "cover_letter_templates_user_id_variation_key" UNIQUE using index "cover_letter_templates_user_id_variation_key";

alter table "public"."cover_letter_templates" add constraint "cover_letter_templates_variation_check" CHECK ((variation = ANY (ARRAY['formal'::text, 'light'::text]))) not valid;

alter table "public"."cover_letter_templates" validate constraint "cover_letter_templates_variation_check";

alter table "public"."cover_letter_tokens" add constraint "cover_letter_tokens_user_id_fkey" FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE not valid;

alter table "public"."cover_letter_tokens" validate constraint "cover_letter_tokens_user_id_fkey";

alter table "public"."cover_letter_tokens" add constraint "cover_letter_tokens_user_id_key" UNIQUE using index "cover_letter_tokens_user_id_key";

alter table "public"."profiles" add constraint "profiles_id_fkey" FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE not valid;

alter table "public"."profiles" validate constraint "profiles_id_fkey";

set check_function_bodies = off;

CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
  INSERT INTO public.profiles (id, email)
  VALUES (NEW.id, NEW.email);
  RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.rls_auto_enable()
 RETURNS event_trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'pg_catalog'
AS $function$
DECLARE
  cmd record;
BEGIN
  FOR cmd IN
    SELECT *
    FROM pg_event_trigger_ddl_commands()
    WHERE command_tag IN ('CREATE TABLE', 'CREATE TABLE AS', 'SELECT INTO')
      AND object_type IN ('table','partitioned table')
  LOOP
     IF cmd.schema_name IS NOT NULL AND cmd.schema_name IN ('public') AND cmd.schema_name NOT IN ('pg_catalog','information_schema') AND cmd.schema_name NOT LIKE 'pg_toast%' AND cmd.schema_name NOT LIKE 'pg_temp%' THEN
      BEGIN
        EXECUTE format('alter table if exists %s enable row level security', cmd.object_identity);
        RAISE LOG 'rls_auto_enable: enabled RLS on %', cmd.object_identity;
      EXCEPTION
        WHEN OTHERS THEN
          RAISE LOG 'rls_auto_enable: failed to enable RLS on %', cmd.object_identity;
      END;
     ELSE
        RAISE LOG 'rls_auto_enable: skip % (either system schema or not in enforced list: %.)', cmd.object_identity, cmd.schema_name;
     END IF;
  END LOOP;
END;
$function$
;

grant delete on table "public"."answers" to "anon";

grant insert on table "public"."answers" to "anon";

grant references on table "public"."answers" to "anon";

grant select on table "public"."answers" to "anon";

grant trigger on table "public"."answers" to "anon";

grant truncate on table "public"."answers" to "anon";

grant update on table "public"."answers" to "anon";

grant delete on table "public"."answers" to "authenticated";

grant insert on table "public"."answers" to "authenticated";

grant references on table "public"."answers" to "authenticated";

grant select on table "public"."answers" to "authenticated";

grant trigger on table "public"."answers" to "authenticated";

grant truncate on table "public"."answers" to "authenticated";

grant update on table "public"."answers" to "authenticated";

grant delete on table "public"."answers" to "service_role";

grant insert on table "public"."answers" to "service_role";

grant references on table "public"."answers" to "service_role";

grant select on table "public"."answers" to "service_role";

grant trigger on table "public"."answers" to "service_role";

grant truncate on table "public"."answers" to "service_role";

grant update on table "public"."answers" to "service_role";

grant delete on table "public"."cover_letter_templates" to "anon";

grant insert on table "public"."cover_letter_templates" to "anon";

grant references on table "public"."cover_letter_templates" to "anon";

grant select on table "public"."cover_letter_templates" to "anon";

grant trigger on table "public"."cover_letter_templates" to "anon";

grant truncate on table "public"."cover_letter_templates" to "anon";

grant update on table "public"."cover_letter_templates" to "anon";

grant delete on table "public"."cover_letter_templates" to "authenticated";

grant insert on table "public"."cover_letter_templates" to "authenticated";

grant references on table "public"."cover_letter_templates" to "authenticated";

grant select on table "public"."cover_letter_templates" to "authenticated";

grant trigger on table "public"."cover_letter_templates" to "authenticated";

grant truncate on table "public"."cover_letter_templates" to "authenticated";

grant update on table "public"."cover_letter_templates" to "authenticated";

grant delete on table "public"."cover_letter_templates" to "service_role";

grant insert on table "public"."cover_letter_templates" to "service_role";

grant references on table "public"."cover_letter_templates" to "service_role";

grant select on table "public"."cover_letter_templates" to "service_role";

grant trigger on table "public"."cover_letter_templates" to "service_role";

grant truncate on table "public"."cover_letter_templates" to "service_role";

grant update on table "public"."cover_letter_templates" to "service_role";

grant delete on table "public"."cover_letter_tokens" to "anon";

grant insert on table "public"."cover_letter_tokens" to "anon";

grant references on table "public"."cover_letter_tokens" to "anon";

grant select on table "public"."cover_letter_tokens" to "anon";

grant trigger on table "public"."cover_letter_tokens" to "anon";

grant truncate on table "public"."cover_letter_tokens" to "anon";

grant update on table "public"."cover_letter_tokens" to "anon";

grant delete on table "public"."cover_letter_tokens" to "authenticated";

grant insert on table "public"."cover_letter_tokens" to "authenticated";

grant references on table "public"."cover_letter_tokens" to "authenticated";

grant select on table "public"."cover_letter_tokens" to "authenticated";

grant trigger on table "public"."cover_letter_tokens" to "authenticated";

grant truncate on table "public"."cover_letter_tokens" to "authenticated";

grant update on table "public"."cover_letter_tokens" to "authenticated";

grant delete on table "public"."cover_letter_tokens" to "service_role";

grant insert on table "public"."cover_letter_tokens" to "service_role";

grant references on table "public"."cover_letter_tokens" to "service_role";

grant select on table "public"."cover_letter_tokens" to "service_role";

grant trigger on table "public"."cover_letter_tokens" to "service_role";

grant truncate on table "public"."cover_letter_tokens" to "service_role";

grant update on table "public"."cover_letter_tokens" to "service_role";

grant delete on table "public"."profiles" to "anon";

grant insert on table "public"."profiles" to "anon";

grant references on table "public"."profiles" to "anon";

grant select on table "public"."profiles" to "anon";

grant trigger on table "public"."profiles" to "anon";

grant truncate on table "public"."profiles" to "anon";

grant update on table "public"."profiles" to "anon";

grant delete on table "public"."profiles" to "authenticated";

grant insert on table "public"."profiles" to "authenticated";

grant references on table "public"."profiles" to "authenticated";

grant select on table "public"."profiles" to "authenticated";

grant trigger on table "public"."profiles" to "authenticated";

grant truncate on table "public"."profiles" to "authenticated";

grant update on table "public"."profiles" to "authenticated";

grant delete on table "public"."profiles" to "service_role";

grant insert on table "public"."profiles" to "service_role";

grant references on table "public"."profiles" to "service_role";

grant select on table "public"."profiles" to "service_role";

grant trigger on table "public"."profiles" to "service_role";

grant truncate on table "public"."profiles" to "service_role";

grant update on table "public"."profiles" to "service_role";


  create policy "Users can manage their own answers"
  on "public"."answers"
  as permissive
  for all
  to public
using ((user_id = auth.uid()))
with check ((user_id = auth.uid()));



  create policy "Users can manage their own cover letter templates"
  on "public"."cover_letter_templates"
  as permissive
  for all
  to public
using ((user_id = auth.uid()))
with check ((user_id = auth.uid()));



  create policy "Users can manage their own cover letter tokens"
  on "public"."cover_letter_tokens"
  as permissive
  for all
  to public
using ((user_id = auth.uid()))
with check ((user_id = auth.uid()));



  create policy "Users can only access their own profile"
  on "public"."profiles"
  as permissive
  for all
  to public
using ((id = auth.uid()));


CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();


  create policy "Users can manage their own cover letters"
  on "storage"."objects"
  as permissive
  for all
  to public
using (((bucket_id = 'cover-letters'::text) AND ((auth.uid())::text = (storage.foldername(name))[1])))
with check (((bucket_id = 'cover-letters'::text) AND ((auth.uid())::text = (storage.foldername(name))[1])));



  create policy "Users can manage their own resumes"
  on "storage"."objects"
  as permissive
  for all
  to public
using (((bucket_id = 'resumes'::text) AND ((auth.uid())::text = (storage.foldername(name))[1])))
with check (((bucket_id = 'resumes'::text) AND ((auth.uid())::text = (storage.foldername(name))[1])));



