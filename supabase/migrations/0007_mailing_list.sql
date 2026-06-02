-- Mailing list: contacts, campaigns, and per-contact send tracking.
-- Run in Supabase SQL editor or via the Supabase CLI.
-- All access is via the service-role key; RLS is enabled but no policies are added.

-- ── Contacts ─────────────────────────────────────────────────────────────────
create table if not exists public.mailing_list_contacts (
  id                uuid        primary key default gen_random_uuid(),
  email             text        not null,
  first_name        text        not null default '',
  last_name         text        not null default '',
  source            text        not null default 'manual'
                                check (source in ('manual', 'registration', 'membership')),
  unsubscribed      boolean     not null default false,
  unsubscribe_token uuid        not null default gen_random_uuid(),
  created_at        timestamptz not null default now(),
  unique (email)
);

create index if not exists mailing_list_email_idx on public.mailing_list_contacts (email);
create index if not exists mailing_list_token_idx on public.mailing_list_contacts (unsubscribe_token);

alter table public.mailing_list_contacts enable row level security;

-- ── Campaigns ─────────────────────────────────────────────────────────────────
create table if not exists public.email_campaigns (
  id           uuid        primary key default gen_random_uuid(),
  subject      text        not null,
  -- body is plain text; paragraphs separated by double newlines.
  -- Supports {{first_name}} token. Converted to HTML at send time.
  body         text        not null default '',
  status       text        not null default 'draft'
                           check (status in ('draft', 'sending', 'sent', 'partial')),
  total_count  integer     not null default 0,
  sent_count   integer     not null default 0,
  failed_count integer     not null default 0,
  created_at   timestamptz not null default now(),
  sent_at      timestamptz
);

alter table public.email_campaigns enable row level security;

-- ── Per-contact send records ──────────────────────────────────────────────────
create table if not exists public.campaign_sends (
  id          uuid        primary key default gen_random_uuid(),
  campaign_id uuid        not null references public.email_campaigns (id) on delete cascade,
  contact_id  uuid        not null references public.mailing_list_contacts (id) on delete cascade,
  status      text        not null default 'pending'
                          check (status in ('pending', 'sent', 'failed')),
  error       text,
  sent_at     timestamptz,
  unique (campaign_id, contact_id)
);

create index if not exists campaign_sends_campaign_status_idx
  on public.campaign_sends (campaign_id, status);

alter table public.campaign_sends enable row level security;
