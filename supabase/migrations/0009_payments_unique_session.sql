-- Ensure each Stripe checkout session is only recorded once in payments.
-- This lets the webhook handler use upsert (onConflict) instead of
-- check-before-insert, making it safe against Stripe's retry behaviour.
ALTER TABLE payments
  ADD CONSTRAINT payments_stripe_session_id_key UNIQUE (stripe_session_id);
