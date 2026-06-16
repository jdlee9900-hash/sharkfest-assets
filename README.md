# sharkfest-assets

SharkFest 2027 — Next.js 15 (App Router) + Supabase + Stripe + Cloudinary.

## Membership (subscriptions + members area)

Paid membership (`/join`) unlocks a gated members area (`/members`) with a digital
membership card, an exclusive content feed, members events, and a **reduced price on
SharkFest 2027 registration** (applied automatically when the payment plan is allocated).

### Setup

1. **Database** — run `supabase/migrations/0001_membership.sql` in the Supabase SQL
   editor. It creates `memberships` and `member_posts`, and adds `registrations.is_member`
   plus `payment_plans.member_discount` / `member_discount_pct`. Apply later migrations in
   order; `0011_pricing_and_booking.sql` adds the admin-editable `site_pricing` table and
   the booking's `tickets` / `food_preference` / `estimated_total` columns.

2. **Stripe** — create a recurring **Price** for each membership tier on a "SharkFest
   Membership" product (Playing £2.50/mo, Non-Playing Social Family £1.50/mo, Non-Playing
   Single Social £1.00/mo) and set the matching `STRIPE_PRICE_*` env vars. Add the
   membership events to the existing webhook endpoint: `checkout.session.completed`,
   `customer.subscription.updated`, `customer.subscription.deleted`,
   `invoice.payment_failed`. The prices shown on the Join page are set in the admin
   **Pricing** page — keep them in sync with the Stripe amounts.

3. **Environment variables** (in addition to the existing Stripe/Supabase/Cloudinary/SMTP
   vars):

   | Variable | Purpose | Default |
   | --- | --- | --- |
   | `STRIPE_PRICE_MONTHLY` | Stripe Price ID for the monthly plan | — (required) |
   | `STRIPE_PRICE_ANNUAL` | Stripe Price ID for the annual plan | — (required) |
   | `MEMBER_DISCOUNT_PERCENT` | % members save on 2027 registration | `10` |

   Reuses `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET` and `NEXT_PUBLIC_SITE_URL`.

### How the member discount works

The discount is applied to the **price** when an admin allocates a payment plan: if the
registration's owner is an active member, `payment_plans.total_amount` is reduced by
`MEMBER_DISCOUNT_PERCENT` and the saving is recorded and shown on the booking page. This
keeps the saving genuine (it lowers what they owe overall) rather than only discounting a
single charge, which would otherwise leave the balance unchanged.

Membership is linked to registrations via `registrations.is_member`, kept in sync on
login (`/auth/callback`) and by the subscription webhook.

## Pricing & SharkFest booking

The **Pricing** admin page (`/admin/pricing`) edits a single `site_pricing` row that holds
the membership monthly prices (shown on `/join`), the SharkFest per-head fees, and the
food-preference options. Defaults live in `lib/pricing.ts`; the server reader/writer is
`lib/pricing-server.ts`.

The booking form (`/register`) uses the fees to show a **live estimated total** as the
member picks adults/children across four ticket types — Full Weekend, 1 Night Camping,
Day Tripper, and Committee (kids free). The total is recomputed server-side from the same
fees on submit (never trusting the client) and stored on `registrations.estimated_total`,
along with the per-category `tickets` and the chosen `food_preference`. The admin
"Allocate payment plan" modal pre-fills with this estimate so the committee can confirm or
adjust it. Members may also nominate **one family** to be pitched near.
