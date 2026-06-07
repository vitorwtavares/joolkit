alter table "public"."cover_letter_templates"
drop constraint if exists "cover_letter_templates_variation_check";

alter table "public"."cover_letter_templates"
add column if not exists "position" smallint,
add column if not exists "label" text;

with ranked_templates as (
  select
    "id",
    row_number() over (
      partition by "user_id"
      order by
        case "variation"
          when 'formal' then 1
          when 'light' then 2
          else 3
        end,
        "created_at",
        "id"
    ) as "next_position"
  from "public"."cover_letter_templates"
)
update "public"."cover_letter_templates" as "templates"
set
  "position" = ranked_templates."next_position",
  "label" = coalesce(
    nullif(trim("templates"."label"), ''),
    case "templates"."variation"
      when 'formal' then 'Formal'
      when 'light' then 'Light'
      else 'Cover letter'
    end
  )
from ranked_templates
where "templates"."id" = ranked_templates."id";

alter table "public"."cover_letter_templates"
alter column "position" set not null,
alter column "label" set not null;

alter table "public"."cover_letter_templates"
add constraint "cover_letter_templates_position_check"
check ("position" between 1 and 10) not valid;

alter table "public"."cover_letter_templates"
validate constraint "cover_letter_templates_position_check";

alter table "public"."cover_letter_templates"
add constraint "cover_letter_templates_label_check"
check (length(trim("label")) > 0) not valid;

alter table "public"."cover_letter_templates"
validate constraint "cover_letter_templates_label_check";

create unique index if not exists "cover_letter_templates_user_id_position_key"
on "public"."cover_letter_templates" using btree ("user_id", "position");
