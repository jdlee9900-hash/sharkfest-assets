# sharkfest-assets

SharkFest 2027 — Next.js 15 (App Router) + Supabase + Stripe + Cloudinary.

## Membership (subscriptions + members area)

Paid membership (`/join`) unlocks a gated members area (`/members`) with a digital
membership card, an exclusive content feed, members events, and a **reduced price on
SharkFest 2027 registration** (applied automatically when the payment plan is allocated).

### Setup

1. **Database** — run `supabase/migrations/0001_membership.sql` in the Supabase SQL
   editor. It creates `memberships` and `member_posts`, and adds `registrations.is_member`
   plus `payment_plans.member_discount` / `member_discount_pct`.

2. **Stripe** — create two recurring **Prices** (monthly and annual) on a "SharkFest
   Membership" product, and add the membership events to the existing webhook endpoint:
   `checkout.session.completed`, `customer.subscription.updated`,
   `customer.subscription.deleted`, `invoice.payment_failed`.

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
