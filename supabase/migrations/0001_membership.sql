-- SharkFest membership subscription schema.
-- Run this in the Supabase SQL editor (or via the Supabase CLI). The app reads and
-- writes these tables exclusively through the service-role client after a server-side
-- auth/role check, so Row Level Security can stay closed by default.

-- ── memberships ───────────────────────────────────────────────────────────────
-- One row per Stripe subscription (a user has at most one active membership).
create table if not exists public.memberships (
  id                     uuid primary key default gen_random_uuid(),
  user_id                uuid not null references auth.users (id) on delete cascade,
  email                  text not null,
  stripe_customer_id     text not null,
  stripe_subscription_id text not null unique,
  stripe_price_id        text,
  plan                   text not null check (plan in ('monthly', 'annual')),
  status                 text not null check (status in ('active', 'past_due', 'canceled', 'incomplete')),
  current_period_end     timestamptz,
  cancel_at_period_end   boolean not null default false,
  created_at             timestamptz not null default now(),
  updated_at             timestamptz not null default now()
);

create index if not exists memberships_user_id_idx on public.memberships (user_id);
create index if not exists memberships_customer_idx on public.memberships (stripe_customer_id);

alter table public.memberships enable row level security;
-- No policies: access is via the service-role key only.

-- ── member_posts ──────────────────────────────────────────────────────────────
-- The members-only content feed. `kind = 'event'` rows use event_at / location.
create table if not exists public.member_posts (
  id              uuid primary key default gen_random_uuid(),
  kind            text not null default 'news' check (kind in ('news', 'event')),
  title           text not null,
  body            text not null default '',
  cover_public_id text,
  event_at        timestamptz,
  location        text,
  published       boolean not null default true,
  author          text,
  created_at      timestamptz not null default now()
);

create index if not exists member_posts_published_idx on public.member_posts (published, created_at desc);

alter table public.member_posts enable row level security;
-- No policies: access is via the service-role key only.

-- ── member ticket discount linkage ────────────────────────────────────────────
-- Flag set when a registration's owner is an active member (visibility for admins).
alter table public.registrations
  add column if not exists is_member boolean not null default false;

-- The member discount is applied to the *price* (payment plan total) when it is
-- allocated, so the saving is real and balance accounting stays coherent. Record
-- the pence saved and the percentage used for transparency on the booking page.
alter table public.payment_plans
  add column if not exists member_discount       integer,
  add column if not exists member_discount_pct   integer;
