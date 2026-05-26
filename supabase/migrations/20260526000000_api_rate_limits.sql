create table if not exists public.api_rate_limits (
  key text primary key,
  count integer not null default 0 check (count >= 0),
  reset_at timestamptz not null,
  updated_at timestamptz not null default now()
);

alter table public.api_rate_limits enable row level security;

create index if not exists api_rate_limits_reset_at_idx
  on public.api_rate_limits(reset_at);

create or replace function public.consume_api_rate_limit(
  p_key text,
  p_limit integer,
  p_window_seconds integer
) returns table (
  allowed boolean,
  remaining integer,
  reset_at timestamptz
) as $$
declare
  v_now timestamptz := now();
  v_count integer;
  v_reset_at timestamptz;
begin
  if p_key is null or length(trim(p_key)) = 0 then
    raise exception 'rate limit key is required';
  end if;

  if p_limit < 1 then
    raise exception 'rate limit must be positive';
  end if;

  if p_window_seconds < 1 then
    raise exception 'rate limit window must be positive';
  end if;

  insert into public.api_rate_limits as limits (key, count, reset_at, updated_at)
  values (p_key, 1, v_now + make_interval(secs => p_window_seconds), v_now)
  on conflict (key) do update
    set count = case
          when limits.reset_at <= v_now then 1
          else limits.count + 1
        end,
        reset_at = case
          when limits.reset_at <= v_now then v_now + make_interval(secs => p_window_seconds)
          else limits.reset_at
        end,
        updated_at = v_now
  returning limits.count, limits.reset_at into v_count, v_reset_at;

  return query select
    v_count <= p_limit,
    greatest(p_limit - v_count, 0),
    v_reset_at;
end;
$$ language plpgsql
security definer
set search_path = public;

revoke all on function public.consume_api_rate_limit(text, integer, integer)
from
  public,
  anon,
  authenticated;

grant execute on function public.consume_api_rate_limit(text, integer, integer) to service_role;
