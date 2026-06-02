create table public.webauthn_credentials (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  credential_id text not null unique,
  public_key text not null,
  counter bigint not null default 0,
  transports text[] default '{}',
  created_at timestamptz not null default now()
);
create index on public.webauthn_credentials (user_id);
create index on public.webauthn_credentials (credential_id);
alter table public.webauthn_credentials enable row level security;
create policy "users can view own credentials" on public.webauthn_credentials
  for select using (auth.uid() = user_id);
