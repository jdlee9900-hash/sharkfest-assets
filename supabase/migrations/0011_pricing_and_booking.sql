-- Admin-editable pricing + richer SharkFest booking.
-- Run in the Supabase SQL editor. Safe to re-run.

-- ── Editable pricing (single-row settings table) ───────────────────────────────
-- One JSON blob holds the membership tier prices (display) and the SharkFest
-- per-head fees. Read/written only via the service-role client behind an admin
-- check, so RLS stays locked with no policies.
create table if not exists public.site_pricing (
  id         int primary key default 1,
  data       jsonb not null,
  updated_at timestamptz not null default now(),
  updated_by text,
  constraint site_pricing_singleton check (id = 1)
);

alter table public.site_pricing enable row level security;

-- Seed defaults (pence). Membership is monthly; festival fees are per head.
insert into public.site_pricing (id, data)
values (1, '{
  "membership": { "playing": 250, "social_family": 150, "social_single": 100 },
  "festival": {
    "full_adult": 14000, "full_kid": 3000,
    "camp_adult": 6000, "camp_kid": 1000,
    "day_adult": 3000, "day_kid": 500,
    "committee_adult": 7000, "committee_kid": 0
  },
  "foodOptions": ["Meat Eater", "Vegetarian", "Gluten Free"]
}'::jsonb)
on conflict (id) do nothing;

-- ── Membership tiers ───────────────────────────────────────────────────────────
-- New named tiers alongside the legacy keys so existing rows keep working.
alter table public.memberships drop constraint if exists memberships_plan_check;
alter table public.memberships
  add constraint memberships_plan_check
  check (plan in (
    'playing', 'social_family', 'social_single',
    'individual', 'family', 'community', 'monthly', 'annual'
  ));

-- ── Richer SharkFest booking ───────────────────────────────────────────────────
-- Per-category ticket counts (full weekend / 1-night camping / day tripper /
-- committee), a simple food preference, and the booker's estimated total (pence)
-- computed from the fees above at submission time.
alter table public.registrations
  add column if not exists tickets         jsonb,
  add column if not exists food_preference text,
  add column if not exists estimated_total integer;
