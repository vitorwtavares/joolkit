-- ── tracker_views ────────────────────────────────────────────────────────────
-- Replaces tracker_view_settings. Each row is a saved view tab for a user:
-- a display name plus optional filter, sort, and column-visibility config.
-- Default views are seeded server-side on first GET /api/tracker/views.

create table public.tracker_views (
  id              uuid        primary key default gen_random_uuid(),
  user_id         uuid        not null references public.profiles(id) on delete cascade,
  name            text        not null,
  position        int         not null default 0,
  is_permanent    boolean     not null default false,
  filter_config   jsonb,
  sort_config     jsonb,
  hidden_columns  jsonb,
  created_at      timestamptz default now(),
  updated_at      timestamptz default now()
);

alter table public.tracker_views enable row level security;

create policy "Users can manage their own tracker views"
  on public.tracker_views for all
  using (user_id = auth.uid());

create index tracker_views_user_position_idx
  on public.tracker_views (user_id, position);

-- ── drop tracker_view_settings ───────────────────────────────────────────────
-- Superseded by tracker_views. The old per-view column settings were never
-- consumed by the client.

drop table if exists public.tracker_view_settings;
