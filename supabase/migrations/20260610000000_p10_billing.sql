-- ── subscriptions ─────────────────────────────────────────────────────────────
-- One row per user, mirroring their Stripe subscription state. Written by the
-- server (service_role) from Checkout sync + webhooks; users may only read their
-- own row. `plan` is a convenience denormalization — current Pro entitlement is
-- derived server-side from status + current_period_end + cancel_at_period_end.

create table public.subscriptions (
  user_id                 uuid        primary key references public.profiles(id) on delete cascade,
  stripe_customer_id      text        unique,
  stripe_subscription_id  text        unique,
  stripe_price_id         text,
  plan                    text        not null default 'free',
  status                  text,
  billing_interval        text,
  currency                text,
  current_period_end      timestamptz,
  cancel_at_period_end    boolean     not null default false,
  created_at              timestamptz not null default now(),
  updated_at              timestamptz not null default now(),

  constraint subscriptions_plan_check check (plan in ('free', 'pro')),
  constraint subscriptions_status_check check (
    status is null or status in (
      'active', 'trialing', 'past_due', 'canceled',
      'incomplete', 'incomplete_expired', 'unpaid', 'paused'
    )
  ),
  constraint subscriptions_billing_interval_check check (
    billing_interval is null or billing_interval in ('monthly', 'quarterly')
  )
);

alter table public.subscriptions enable row level security;

create policy "Users can read their own subscription"
  on public.subscriptions for select
  using (user_id = auth.uid());

grant select on table public.subscriptions to authenticated;
grant all on table public.subscriptions to service_role;

-- ── stripe_events ─────────────────────────────────────────────────────────────
-- Webhook idempotency ledger. Internal only — no user-facing access. The Stripe
-- event id is the primary key, so re-delivered events are dropped on conflict.

create table public.stripe_events (
  id            text        primary key,
  type          text        not null,
  processed_at  timestamptz not null default now()
);

alter table public.stripe_events enable row level security;

grant all on table public.stripe_events to service_role;

-- PDF export quotas (Free 1/day, Pro 25/day) reuse the existing api_rate_limits
-- table + consume_api_rate_limit RPC — the per-plan limit is passed at call time,
-- so no extra table is needed here.
