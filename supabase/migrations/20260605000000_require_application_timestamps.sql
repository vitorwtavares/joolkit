-- Manual imports can explicitly set timestamp columns to null, bypassing the
-- default now() values. Keep the backfill here so every environment can apply
-- the not-null constraints cleanly.
update public.applications
set
  created_at = coalesce(created_at, updated_at, last_moved_at, now()),
  updated_at = coalesce(updated_at, created_at, last_moved_at, now())
where created_at is null
   or updated_at is null;

alter table public.applications
  alter column created_at set not null,
  alter column updated_at set not null;
