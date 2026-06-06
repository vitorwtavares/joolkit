create table "public"."resume_variations" (
  "id" uuid primary key default gen_random_uuid(),
  "user_id" uuid not null references "public"."profiles"("id") on delete cascade,
  "position" smallint not null check ("position" between 1 and 10),
  "label" text not null check (length(trim("label")) > 0),
  "file_url" text not null check (length(trim("file_url")) > 0),
  "created_at" timestamp with time zone not null default now(),
  "updated_at" timestamp with time zone not null default now(),
  unique ("user_id", "position")
);

alter table "public"."resume_variations" enable row level security;

insert into "public"."resume_variations" ("user_id", "position", "label", "file_url")
select "id", 1, 'Resume 1', "resume_url"
from "public"."profiles"
where "resume_url" is not null and "resume_url" <> ''
on conflict ("user_id", "position") do nothing;

grant all on table "public"."resume_variations" to "anon";
grant all on table "public"."resume_variations" to "authenticated";
grant all on table "public"."resume_variations" to "service_role";

create policy "Users can manage their own resume variations"
on "public"."resume_variations"
as permissive
for all
to public
using (("user_id" = auth.uid()))
with check (("user_id" = auth.uid()));
