-- OSRS Max Cape Roadmap — schema
-- Single-user app (fr3nchy). All access via Next.js server routes using the
-- service-role key. No browser/anon access -> RLS on, no permissive policies.

create extension if not exists "pgcrypto";

-- Big goals / next-session game plan (notes only, no AI).
create table if not exists public.plans (
  id          uuid primary key default gen_random_uuid(),
  "user"      text not null,
  title       text not null,
  target      text,
  notes       text,
  status      text not null default 'planned',  -- planned | active | done
  sort        int  not null default 0,
  updated_at  timestamptz not null default now()
);

create index if not exists plans_user_idx on public.plans ("user");

-- App settings (replaces localStorage): training-method selections, ordering,
-- playtime density. One row per user.
create table if not exists public.settings (
  "user"        text primary key,
  methods       jsonb not null default '{}'::jsonb,
  order_type    text  not null default 'efficient',
  hours_per_day numeric not null default 4,
  updated_at    timestamptz not null default now()
);

-- Lock down direct access; service-role bypasses RLS so server routes still work.
alter table public.plans    enable row level security;
alter table public.settings enable row level security;
