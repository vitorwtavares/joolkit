alter table "public"."cover_letter_tokens"
rename to "cover_letter_tokens_legacy";

create table "public"."cover_letter_tokens" (
  "id" uuid not null default gen_random_uuid(),
  "user_id" uuid not null,
  "token_key" text not null,
  "token_value" text not null default '',
  "position" integer not null,
  "created_at" timestamp with time zone not null default now(),
  "updated_at" timestamp with time zone not null default now()
);

alter table "public"."cover_letter_tokens" enable row level security;

insert into "public"."cover_letter_tokens" (
  "user_id",
  "token_key",
  "token_value",
  "position",
  "created_at",
  "updated_at"
)
select
  "user_id",
  'role',
  "role",
  1,
  "updated_at",
  "updated_at"
from "public"."cover_letter_tokens_legacy"
where coalesce(trim("role"), '') <> '';

insert into "public"."cover_letter_tokens" (
  "user_id",
  "token_key",
  "token_value",
  "position",
  "created_at",
  "updated_at"
)
select
  "user_id",
  'company',
  "company",
  2,
  "updated_at",
  "updated_at"
from "public"."cover_letter_tokens_legacy"
where coalesce(trim("company"), '') <> '';

drop table "public"."cover_letter_tokens_legacy";

alter table "public"."cover_letter_tokens"
add constraint "cover_letter_tokens_pkey" primary key ("id");

alter table "public"."cover_letter_tokens"
add constraint "cover_letter_tokens_user_id_fkey"
foreign key ("user_id") references "public"."profiles"("id") on delete cascade;

alter table "public"."cover_letter_tokens"
add constraint "cover_letter_tokens_token_key_check"
check (trim("token_key") <> '');

alter table "public"."cover_letter_tokens"
add constraint "cover_letter_tokens_position_check"
check ("position" > 0);

create unique index "cover_letter_tokens_user_id_token_key_key"
on "public"."cover_letter_tokens" using btree ("user_id", "token_key");

create index "cover_letter_tokens_user_id_position_idx"
on "public"."cover_letter_tokens" using btree ("user_id", "position");

grant all on table "public"."cover_letter_tokens" to "anon";
grant all on table "public"."cover_letter_tokens" to "authenticated";
grant all on table "public"."cover_letter_tokens" to "service_role";

create policy "Users can manage their own cover letter tokens"
on "public"."cover_letter_tokens"
as permissive
for all
to public
using (("user_id" = auth.uid()))
with check (("user_id" = auth.uid()));
