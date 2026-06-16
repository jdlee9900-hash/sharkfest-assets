-- Per-person food preferences on a SharkFest booking.
-- Run in the Supabase SQL editor. Safe to re-run.
--
-- `food_preferences` holds one entry per attendee, e.g.
--   [{ "kind": "adult", "choice": "Vegetarian" }, { "kind": "child", "choice": "" }]
-- The existing `food_preference` column keeps a short summary for quick display.
alter table public.registrations
  add column if not exists food_preferences jsonb;
