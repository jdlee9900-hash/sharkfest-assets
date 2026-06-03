-- Add 'community' (free) plan tier to memberships.
-- Community members get access to the members area and mailing list
-- but no festival registration discount (is_member stays false).

alter table public.memberships
  drop constraint if exists memberships_plan_check;

alter table public.memberships
  add constraint memberships_plan_check
    check (plan in ('individual', 'family', 'monthly', 'annual', 'community'));
