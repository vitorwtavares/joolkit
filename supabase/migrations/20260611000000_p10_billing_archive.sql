-- ── P10 downgrade archive flag ────────────────────────────────────────────────
-- When a user drops from Pro to Free, over-limit rows are stamped `archived_at`
-- (frozen: hidden from lists, blocked on direct access, preserved in place)
-- instead of being deleted. The Free limit counts only ACTIVE rows
-- (archived_at IS NULL), so a downgraded user can still create/delete within
-- their Free allowance. Re-subscribing clears the flag and restores everything.

alter table public.applications add column archived_at timestamptz;
alter table public.answers add column archived_at timestamptz;
alter table public.resume_variations add column archived_at timestamptz;
alter table public.cover_letter_templates add column archived_at timestamptz;
alter table public.cover_letter_tokens add column archived_at timestamptz;

-- Active-set reads filter `archived_at IS NULL` per user; partial indexes keep
-- those cheap as archived rows accumulate.
create index applications_active_idx
  on public.applications (user_id) where archived_at is null;
create index answers_active_idx
  on public.answers (user_id) where archived_at is null;
create index resume_variations_active_idx
  on public.resume_variations (user_id) where archived_at is null;
create index cover_letter_templates_active_idx
  on public.cover_letter_templates (user_id) where archived_at is null;
create index cover_letter_tokens_active_idx
  on public.cover_letter_tokens (user_id) where archived_at is null;
