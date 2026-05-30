-- Member event RSVPs: lets logged-in members say whether they're coming to a
-- member event, with adult/child counts, so admins can see who's interested.
-- Run in the Supabase SQL editor after 0002_member_event_pages.sql.

create table if not exists public.event_rsvps (
  id          uuid primary key default gen_random_uuid(),
  event_id    uuid not null references public.member_posts (id) on delete cascade,
  user_id     uuid not null references auth.users (id) on delete cascade,
  email       text not null,
  name        text,
  response    text not null check (response in ('going', 'not_going')),
  adults      integer not null default 1 check (adults  >= 0 and adults  <= 50),
  kids        integer not null default 0 check (kids    >= 0 and kids    <= 50),
  note        text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  -- One response per member per event (upserted when they change their mind).
  unique (event_id, user_id)
);

create index if not exists event_rsvps_event_idx on public.event_rsvps (event_id);

alter table public.event_rsvps enable row level security;
-- No policies: access is via the service-role key only, after a server-side check.
