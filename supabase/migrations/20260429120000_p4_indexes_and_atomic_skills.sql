-- ── indexes on hot paths ─────────────────────────────────────────────────────

create index if not exists applications_user_id_idx     on public.applications(user_id);
create index if not exists applications_status_idx      on public.applications(status);
create index if not exists applications_location_id_idx on public.applications(location_id);
create index if not exists application_skills_application_id_idx on public.application_skills(application_id);
create index if not exists application_skills_skill_id_idx       on public.application_skills(skill_id);
create index if not exists locations_user_id_idx        on public.locations(user_id);
create index if not exists skills_user_id_idx           on public.skills(user_id);
create index if not exists tracker_view_settings_user_id_idx on public.tracker_view_settings(user_id);

-- ── last_moved_at default ────────────────────────────────────────────────────
-- New rows now get last_moved_at = now() on creation; the BEFORE UPDATE trigger
-- continues to bump it on any subsequent status change.

alter table public.applications
  alter column last_moved_at set default now();

-- ── application_skills RLS: explicit with check ──────────────────────────────

drop policy if exists "Users can manage their own application skills" on public.application_skills;

create policy "Users can manage their own application skills"
  on public.application_skills for all
  using (
    exists (
      select 1 from public.applications
      where id = application_skills.application_id
        and user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.applications
      where id = application_skills.application_id
        and user_id = auth.uid()
    )
  );

-- ── set_application_skills RPC (atomic delete + insert) ──────────────────────
-- Replaces the application's skill list in a single transaction. Validates that
-- the application and all skill_ids belong to the caller before mutating.

create or replace function public.set_application_skills(
  p_application_id uuid,
  p_user_id        uuid,
  p_skill_ids      uuid[]
) returns void as $$
declare
  v_input_count int := coalesce(array_length(p_skill_ids, 1), 0);
  v_owned_count int;
begin
  if not exists (
    select 1 from public.applications
    where id = p_application_id and user_id = p_user_id
  ) then
    raise exception 'Application not found or not owned by user'
      using errcode = 'P0001';
  end if;

  if v_input_count > 0 then
    select count(*) into v_owned_count
    from public.skills
    where user_id = p_user_id and id = any(p_skill_ids);

    if v_owned_count != v_input_count then
      raise exception 'One or more skill_ids are invalid'
        using errcode = 'P0002';
    end if;
  end if;

  delete from public.application_skills
  where application_id = p_application_id;

  if v_input_count > 0 then
    insert into public.application_skills (application_id, skill_id)
    select p_application_id, unnest(p_skill_ids);
  end if;
end;
$$ language plpgsql;
