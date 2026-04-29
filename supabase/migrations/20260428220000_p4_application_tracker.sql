-- ── locations ────────────────────────────────────────────────────────────────

create table public.locations (
  id          uuid        primary key default gen_random_uuid(),
  user_id     uuid        not null references public.profiles(id) on delete cascade,
  name        text        not null,
  created_at  timestamptz default now(),
  unique(user_id, name)
);

alter table public.locations enable row level security;

create policy "Users can manage their own locations"
  on public.locations for all
  using (user_id = auth.uid());

-- ── skills ───────────────────────────────────────────────────────────────────

create table public.skills (
  id          uuid        primary key default gen_random_uuid(),
  user_id     uuid        not null references public.profiles(id) on delete cascade,
  name        text        not null,
  created_at  timestamptz default now(),
  unique(user_id, name)
);

alter table public.skills enable row level security;

create policy "Users can manage their own skills"
  on public.skills for all
  using (user_id = auth.uid());

-- ── applications ─────────────────────────────────────────────────────────────

create table public.applications (
  id              uuid        primary key default gen_random_uuid(),
  user_id         uuid        not null references public.profiles(id) on delete cascade,
  company_name    text        not null default '',
  careers_url     text,
  job_url         text,
  status          text        not null default 'prospect',
  location_id     uuid        references public.locations(id) on delete set null,
  salary          text,
  work_style      text,
  visa_support    text,
  is_favorite     boolean     not null default false,
  date_applied    date,
  next_deadline   date,
  notes           jsonb,
  last_moved_at   timestamptz,
  created_at      timestamptz default now(),
  updated_at      timestamptz default now(),

  constraint applications_status_check check (status in (
    'prospect', 'no_openings', 'ready_to_apply', 'applied',
    'pending_schedule', 'interview_scheduled', 'awaiting_response',
    'technical_test', 'offer_received', 'rejected', 'rejected_ghosted', 'signed'
  )),
  constraint applications_work_style_check check (
    work_style is null or work_style in ('remote', 'hybrid', 'on-site')
  ),
  constraint applications_visa_support_check check (
    visa_support is null or visa_support in ('yes', 'no', 'unknown')
  )
);

alter table public.applications enable row level security;

create policy "Users can manage their own applications"
  on public.applications for all
  using (user_id = auth.uid());

-- ── application_skills ───────────────────────────────────────────────────────

create table public.application_skills (
  id              uuid  primary key default gen_random_uuid(),
  application_id  uuid  not null references public.applications(id) on delete cascade,
  skill_id        uuid  not null references public.skills(id) on delete cascade,
  unique(application_id, skill_id)
);

alter table public.application_skills enable row level security;

create policy "Users can manage their own application skills"
  on public.application_skills for all
  using (
    exists (
      select 1 from public.applications
      where id = application_skills.application_id
        and user_id = auth.uid()
    )
  );

-- ── tracker_view_settings ────────────────────────────────────────────────────

create table public.tracker_view_settings (
  id              uuid        primary key default gen_random_uuid(),
  user_id         uuid        not null references public.profiles(id) on delete cascade,
  view            text        not null,
  column_order    jsonb,
  hidden_columns  jsonb,
  created_at      timestamptz default now(),
  updated_at      timestamptz default now(),
  unique(user_id, view),
  constraint tracker_view_settings_view_check check (view in (
    'all', 'prospects', 'ready', 'applied', 'in-progress', 'no-openings', 'favorites'
  ))
);

alter table public.tracker_view_settings enable row level security;

create policy "Users can manage their own tracker view settings"
  on public.tracker_view_settings for all
  using (user_id = auth.uid());

-- ── last_moved_at trigger ─────────────────────────────────────────────────────

create or replace function public.update_last_moved_at()
returns trigger as $$
begin
  if new.status is distinct from old.status then
    new.last_moved_at = now();
  end if;
  return new;
end;
$$ language plpgsql;

create trigger set_last_moved_at
  before update on public.applications
  for each row execute function public.update_last_moved_at();
