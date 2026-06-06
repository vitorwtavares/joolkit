alter table "public"."answers"
  add column "tags" text[] not null default '{}';
