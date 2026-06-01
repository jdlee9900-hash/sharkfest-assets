-- SharkFest "camp near" preferences.
-- Lets a registrant nominate up to two other people (existing registrations)
-- they'd like to be pitched near, so the committee can group them when planning
-- the site. Stored as self-references on the registrations table.
--
-- Access is via the service-role client after a server-side check, so RLS on
-- registrations stays as-is. Run in the Supabase SQL editor (or via the CLI).

alter table public.registrations
  add column if not exists camp_near_1 uuid references public.registrations (id) on delete set null,
  add column if not exists camp_near_2 uuid references public.registrations (id) on delete set null;

-- A registration can't choose itself, and can't pick the same person twice.
alter table public.registrations
  drop constraint if exists registrations_camp_near_not_self;
alter table public.registrations
  add constraint registrations_camp_near_not_self check (
    (camp_near_1 is null or camp_near_1 <> id) and
    (camp_near_2 is null or camp_near_2 <> id) and
    (camp_near_1 is null or camp_near_2 is null or camp_near_1 <> camp_near_2)
  );

-- Helps the committee find "who wants to be near whom" quickly.
create index if not exists registrations_camp_near_1_idx on public.registrations (camp_near_1);
create index if not exists registrations_camp_near_2_idx on public.registrations (camp_near_2);
