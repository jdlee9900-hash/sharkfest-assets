-- Interest list for the Sharks SA Tour 2028 (/sa page).
-- Simple capture table — no auth required, written via the service role only.
create table if not exists sa_tour_interest (
  id          uuid primary key default gen_random_uuid(),
  ref         text not null unique,
  name        text not null,
  email       text not null,
  adults      int  not null default 2 check (adults between 1 and 12),
  kids        int  not null default 0 check (kids between 0 and 12),
  created_at  timestamptz not null default now()
);

create index if not exists sa_tour_interest_email_idx on sa_tour_interest (email);

-- Service-role access only (no anon policies needed).
alter table sa_tour_interest enable row level security;
