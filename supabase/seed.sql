-- Local-only seed (runs after migrations on `supabase db reset`; never touches
-- the hosted project). Recreates the storage buckets that exist in production
-- but aren't created by any migration — the remote schema ships only their RLS
-- policies, and the buckets themselves were made by hand in the dashboard.
insert into storage.buckets (id, name, public)
values
  ('resumes', 'resumes', false),
  ('cover-letters', 'cover-letters', false)
on conflict (id) do nothing;
