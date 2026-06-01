-- SharkFest membership tiers + shared second login.
-- Run in the Supabase SQL editor. Safe to re-run.

-- ── Membership tiers ──────────────────────────────────────────────────────────
-- Replace the monthly/annual cadence with Individual/Couple + Family tiers.
-- Legacy 'monthly'/'annual' values stay valid so existing rows don't break.
alter table public.memberships drop constraint if exists memberships_plan_check;
alter table public.memberships
  add constraint memberships_plan_check
  check (plan in ('individual', 'family', 'monthly', 'annual'));

-- ── Shared second login on a booking ──────────────────────────────────────────
-- A booking can carry one additional email; once that person logs in (magic link)
-- their account id is stamped here, letting both accounts see the same booking and
-- the shared membership.
alter table public.registrations
  add column if not exists partner_email   text,
  add column if not exists partner_user_id uuid references auth.users (id) on delete set null;

create index if not exists registrations_partner_email_idx
  on public.registrations (lower(partner_email));
create index if not exists registrations_partner_user_id_idx
  on public.registrations (partner_user_id);
