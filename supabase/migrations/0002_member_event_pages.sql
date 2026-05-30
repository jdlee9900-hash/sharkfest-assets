-- Richer member events: a short summary for cards/listings and an optional end
-- time, so events can have full dedicated pages in the members area.
-- Run this in the Supabase SQL editor after 0001_membership.sql.

alter table public.member_posts
  add column if not exists summary   text,
  add column if not exists event_end timestamptz;
