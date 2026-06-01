-- 0006: Payment method preference on registrations.
-- Supports 'full' (deposit + pay-as-you-go, the original default) or
-- 'instalments' (3 equal monthly instalments, auto-created at plan allocation).
-- Nullable so existing rows without a preference are treated as 'full'.

ALTER TABLE registrations
  ADD COLUMN IF NOT EXISTS payment_method TEXT
  CHECK (payment_method IN ('full', 'instalments'));

COMMENT ON COLUMN registrations.payment_method IS
  'Payment preference chosen at registration: ''full'' = deposit + balance, ''instalments'' = 3 equal monthly instalments.';
