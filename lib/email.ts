import nodemailer from 'nodemailer'
import type { FestivalEvent } from './events'
import { planLabel as memberPlanLabel, type MemberPlan } from './types'

// Default event for templates that don't (yet) take one — keeps existing
// payment/receipt emails unchanged while registration emails go per-event.
const DEFAULT_EVENT: Pick<FestivalEvent, 'name'> = { name: 'SharkFest 2027' }

export function getOrigin(): string {
  return process.env.NEXT_PUBLIC_SITE_URL ?? 'https://sharkfest.co.uk'
}

export function getAdminEmails(): string[] {
  return (process.env.ADMIN_EMAILS ?? '').split(',').map(e => e.trim()).filter(Boolean)
}

function getTransporter() {
  const user = process.env.SMTP_USER
  const pass = process.env.SMTP_PASS
  if (!user || !pass) return null
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST ?? 'smtp-relay.brevo.com',
    port: Number(process.env.SMTP_PORT ?? 587),
    secure: false,
    auth: { user, pass },
  })
}

interface EmailBody { html: string; text: string }

export async function sendEmail(to: string | string[], subject: string, body: EmailBody): Promise<void> {
  const transporter = getTransporter()
  if (!transporter) {
    throw new Error('SMTP not configured: SMTP_USER or SMTP_PASS env var is missing')
  }

  const from = process.env.EMAIL_FROM ?? `SharkFest <${process.env.SMTP_USER}>`

  await transporter.sendMail({
    from,
    to: Array.isArray(to) ? to.join(', ') : to,
    subject,
    html: body.html,
    text: body.text,
  })
}

// ── Shared helpers ────────────────────────────────────────────────────────────

function fmtGBP(pence: number): string {
  return `£${(pence / 100).toFixed(2)}`
}

function fmtDate(iso: string | null | undefined): string {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
}

const CONTACT = 'sharkfest2025@gmail.com'

// ── HTML helpers ──────────────────────────────────────────────────────────────

function htmlWrap(body: string, eventName = 'SharkFest 2027'): string {
  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${eventName}</title></head>
<body style="margin:0;padding:0;background:#f1f5f9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;color:#0f172a;-webkit-font-smoothing:antialiased">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f1f5f9;padding:40px 16px">
  <tr><td align="center">
    <table cellpadding="0" cellspacing="0" style="width:100%;max-width:540px">
      <tr><td style="background:#0f172a;border-radius:8px 8px 0 0;padding:24px 32px">
        <p style="margin:0 0 4px;font-size:11px;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;color:#fbbf24">Torbay Sharks RFC</p>
        <p style="margin:0;font-size:22px;font-weight:700;color:#ffffff;letter-spacing:-0.01em">${eventName}</p>
      </td></tr>
      <tr><td style="background:#ffffff;padding:32px">${body}</td></tr>
      <tr><td style="background:#ffffff;border-top:1px solid #e2e8f0;border-radius:0 0 8px 8px;padding:16px 32px 24px">
        <p style="margin:0;font-size:12px;color:#94a3b8;line-height:1.6">
          Torbay Sharks RFC · Devon Coast<br>
          Questions? <a href="mailto:${CONTACT}" style="color:#94a3b8">${CONTACT}</a>
        </p>
      </td></tr>
    </table>
  </td></tr>
</table>
</body></html>`
}

function hp(text: string): string {
  return `<p style="margin:0 0 16px;font-size:15px;line-height:1.65;color:#0f172a">${text}</p>`
}

function hh(text: string): string {
  return `<h1 style="margin:0 0 20px;font-size:21px;font-weight:700;color:#0f172a">${text}</h1>`
}

function hcta(label: string, url: string): string {
  return `<p style="margin:24px 0 0"><a href="${url}" style="display:inline-block;background:#fbbf24;color:#0f172a;font-size:14px;font-weight:700;padding:12px 24px;border-radius:6px;text-decoration:none">${label}</a></p>
  <p style="margin:10px 0 0;font-size:12px;color:#94a3b8">Or copy: <a href="${url}" style="color:#64748b">${url}</a></p>`
}

function hSummary(rows: [string, string][]): string {
  const cells = rows.map(([l, v]) =>
    `<tr>
      <td style="padding:8px 16px 8px 0;font-size:13px;color:#64748b;white-space:nowrap;vertical-align:top">${l}</td>
      <td style="padding:8px 0;font-size:14px;font-weight:600;color:#0f172a">${v}</td>
    </tr>`
  ).join('')
  return `<table cellpadding="0" cellspacing="0" style="width:100%;background:#f8fafc;border-radius:6px;padding:8px 16px;margin:0 0 20px">${cells}</table>`
}

// ── Plain-text helpers ────────────────────────────────────────────────────────

function textWrap(title: string, body: string): string {
  return `${title}\n${'─'.repeat(title.length)}\n\n${body.trim()}\n\n---\nTorbay Sharks RFC · Devon Coast\nQuestions? ${CONTACT}\n`
}

function tSummary(rows: [string, string][]): string {
  const maxLabel = Math.max(...rows.map(([l]) => l.length))
  return rows.map(([l, v]) => `  ${l.padEnd(maxLabel + 2)}${v}`).join('\n') + '\n'
}

// ── Templates ─────────────────────────────────────────────────────────────────

export function emailRegistrationUser(
  reg: { first_name: string },
  origin: string,
  event: Pick<FestivalEvent, 'name'> = DEFAULT_EVENT,
  paymentMethod?: 'full' | 'instalments' | null,
): EmailBody {
  const url = `${origin}/my-booking`
  const paymentNote = paymentMethod === 'instalments'
    ? "You've chosen to pay in <strong>3 equal instalments</strong>. Once we've reviewed your booking, we'll send your confirmed payment schedule with amounts and due dates."
    : "Once reviewed, we'll set up a payment plan and send you the total cost with instructions on how to pay the deposit to secure your place."
  const paymentNoteText = paymentMethod === 'instalments'
    ? "You've chosen to pay in 3 equal instalments. Once we've reviewed your booking,\nwe'll send your confirmed payment schedule with amounts and due dates."
    : "Once reviewed, we'll set up a payment plan and send you the total cost with\ninstructions on how to pay the deposit to secure your place."
  return {
    html: htmlWrap(`
      ${hh('Registration received')}
      ${hp(`Hi ${reg.first_name},`)}
      ${hp(`Thank you for registering for ${event.name}. We've received your details and will review your booking shortly.`)}
      ${hp(paymentNote)}
      ${hp('You can check your booking status at any time:')}
      ${hcta('View my booking', url)}
    `, event.name),
    text: textWrap(`${event.name} — Registration received`, `
Hi ${reg.first_name},

Thank you for registering for ${event.name}. We've received your details
and will review your booking shortly.

${paymentNoteText}

View your booking: ${url}
    `),
  }
}

export function emailRegistrationAdmin(
  reg: { id: string; first_name: string; surname: string; email: string; mobile: string; adults: number; kids: number; accommodation: string; electric_hookup: boolean; food_preference?: string | null; estimated_total?: number | null },
  origin: string,
  event: Pick<FestivalEvent, 'name'> = DEFAULT_EVENT
): EmailBody {
  const party = `${reg.adults} adult${reg.adults !== 1 ? 's' : ''}${reg.kids ? `, ${reg.kids} child${reg.kids !== 1 ? 'ren' : ''}` : ''}`
  const accom = `${reg.accommodation}${reg.electric_hookup ? ' + electric hookup' : ''}`
  const url   = `${origin}/admin`
  // Optional extra rows from the richer booking flow.
  const extra: [string, string][] = []
  if (reg.estimated_total != null) extra.push(['Est. total', `£${(reg.estimated_total / 100).toFixed(2)}`])
  if (reg.food_preference) extra.push(['Food', reg.food_preference])
  const rows: [string, string][] = [
    ['Event',         event.name],
    ['Name',          `${reg.first_name} ${reg.surname}`],
    ['Email',         reg.email],
    ['Mobile',        reg.mobile],
    ['Party',         party],
    ['Accommodation', accom],
    ...extra,
  ]
  return {
    html: htmlWrap(`
      ${hh(`New ${event.name} registration`)}
      ${hp(`A new ${event.name} registration has been submitted and is awaiting review.`)}
      ${hSummary(rows)}
      ${hcta('Open admin panel', url)}
    `, event.name),
    text: textWrap(`${event.name} — New registration`, `
A new ${event.name} registration is awaiting review.

${tSummary(rows)}
Admin panel: ${url}
    `),
  }
}

export function emailPlanAllocated(
  reg: { first_name: string },
  plan: { total_amount: number; notes: string | null; member_discount_pct?: number | null },
  origin: string,
  instalmentSchedule?: { label: string; amount: number; dueDateIso: string }[] | null,
): EmailBody {
  const url = `${origin}/my-booking`

  if (instalmentSchedule?.length) {
    // Instalment payment plan
    const discountRows: [string, string][] = plan.member_discount_pct
      ? [['Member discount', `${plan.member_discount_pct}% applied ✓`]]
      : []
    const scheduleRows: [string, string][] = instalmentSchedule.map(i => [
      i.label,
      `${fmtGBP(i.amount)} — due ${fmtDate(i.dueDateIso)}`,
    ])
    const summaryRows: [string, string][] = [
      ...discountRows,
      ['Total cost', fmtGBP(plan.total_amount)],
      ...scheduleRows,
      ...(plan.notes ? [['Notes', plan.notes] as [string, string]] : []),
    ]
    return {
      html: htmlWrap(`
        ${hh('Your instalment schedule is ready')}
        ${hp(`Hi ${reg.first_name},`)}
        ${hp('Your SharkFest 2027 booking has been reviewed and your instalment schedule is confirmed.')}
        ${hSummary(summaryRows)}
        ${hp('Pay each instalment by its due date via your booking page. You can pay ahead of schedule at any time.')}
        ${hcta('View payment schedule', url)}
      `),
      text: textWrap('SharkFest 2027 — Your instalment schedule is ready', `
Hi ${reg.first_name},

Your SharkFest 2027 booking has been reviewed and your instalment schedule is confirmed.

${tSummary(summaryRows)}
Pay each instalment by its due date via your booking page.
You can pay ahead of schedule at any time.

View your booking: ${url}
      `),
    }
  }

  // Full / deposit plan (default)
  const remaining = Math.max(0, plan.total_amount - 5000)
  const summaryRows: [string, string][] = [
    ...(plan.member_discount_pct ? [[`Member discount`, `${plan.member_discount_pct}% applied ✓`] as [string, string]] : []),
    ['Total cost',        fmtGBP(plan.total_amount)],
    ['Deposit due now',   '£50.00'],
    ['Remaining balance', fmtGBP(remaining)],
    ...(plan.notes ? [['Notes', plan.notes] as [string, string]] : []),
  ]
  return {
    html: htmlWrap(`
      ${hh('Your payment plan is ready')}
      ${hp(`Hi ${reg.first_name},`)}
      ${hp('Your SharkFest 2027 booking has been reviewed and your payment plan is now set up.')}
      ${hSummary(summaryRows)}
      ${hp('To secure your place, please pay the <strong>£50 deposit</strong> as soon as possible. You can pay the remaining balance at any time in amounts that suit you.')}
      ${hcta('Pay deposit now', url)}
    `),
    text: textWrap('SharkFest 2027 — Your payment plan is ready', `
Hi ${reg.first_name},

Your SharkFest 2027 booking has been reviewed and your payment plan is now set up.

${tSummary(summaryRows)}
To secure your place, please pay the £50 deposit as soon as possible.
You can pay the remaining balance at any time in amounts that suit you.

Pay now: ${url}
    `),
  }
}

export function emailPaymentReceipt(
  reg: { first_name: string },
  amount: number,
  paidAt: string | null,
  outstanding: number,
  origin: string
): EmailBody {
  const url = `${origin}/my-booking`
  const summaryRows: [string, string][] = [
    ['Amount paid',        fmtGBP(amount)],
    ['Date',               fmtDate(paidAt)],
    ['Outstanding balance', outstanding > 0 ? fmtGBP(outstanding) : 'Paid in full ✓'],
  ]
  const bodyNote = outstanding > 0
    ? `You have an outstanding balance of ${fmtGBP(outstanding)}. You can pay this at any time through your booking page.`
    : "Your balance is now fully paid — nothing more to do. We look forward to seeing you at SharkFest 2027!"
  return {
    html: htmlWrap(`
      ${hh('Payment confirmed')}
      ${hp(`Hi ${reg.first_name},`)}
      ${hp("We've received your payment. Here's a summary:")}
      ${hSummary(summaryRows)}
      ${hp(outstanding > 0
        ? `You have an outstanding balance of <strong>${fmtGBP(outstanding)}</strong>. You can pay this at any time through your booking page.`
        : "Your balance is now fully paid — nothing more to do. We look forward to seeing you at SharkFest 2027!"
      )}
      ${hcta('View my booking', url)}
    `),
    text: textWrap('SharkFest 2027 — Payment confirmed', `
Hi ${reg.first_name},

We've received your payment. Here's a summary:

${tSummary(summaryRows)}
${bodyNote}

View your booking: ${url}
    `),
  }
}

export function emailMembershipWelcome(
  member: { first_name: string },
  plan: MemberPlan,
  origin: string
): EmailBody {
  const url = `${origin}/members`
  const isCommunity = plan === 'community'
  const planLabel = isCommunity ? 'Community membership' : `${memberPlanLabel(plan)} membership`
  const perksNote = isCommunity
    ? 'Your members area is ready: exclusive content, members events, and your digital membership card.'
    : 'Your members area is ready: exclusive content, members events, your digital membership card, and a reduced price on SharkFest 2027 tickets.'
  const perksNoteText = isCommunity
    ? 'Your members area is ready: exclusive content, members events, and your\ndigital membership card.'
    : 'Your members area is ready: exclusive content, members events, your digital\nmembership card, and a reduced price on SharkFest 2027 tickets.'
  return {
    html: htmlWrap(`
      ${hh('Welcome to the club')}
      ${hp(`Hi ${member.first_name},`)}
      ${hp("Your Torbay Sharks RFC membership is now active — welcome to the community.")}
      ${hSummary([['Membership', planLabel], ['Status', 'Active ✓']])}
      ${hp(perksNote)}
      ${hcta('Enter the members area', url)}
    `),
    text: textWrap('SharkFest — Welcome to the club', `
Hi ${member.first_name},

Your Torbay Sharks RFC membership is now active — welcome to the community.

${tSummary([['Membership', planLabel], ['Status', 'Active']])}
${perksNoteText}

Enter the members area: ${url}
    `),
  }
}

export function emailMembershipPaymentFailed(
  member: { first_name: string },
  origin: string
): EmailBody {
  const url = `${origin}/members`
  return {
    html: htmlWrap(`
      ${hh('We couldn’t take your membership payment')}
      ${hp(`Hi ${member.first_name},`)}
      ${hp('A payment for your SharkFest membership failed. Your access continues for now, but please update your payment details to avoid losing your membership.')}
      ${hcta('Update payment details', url)}
    `),
    text: textWrap('SharkFest — Membership payment failed', `
Hi ${member.first_name},

A payment for your SharkFest membership failed. Your access continues for now,
but please update your payment details to avoid losing your membership.

Update payment details: ${url}
    `),
  }
}

export function emailMembershipCancelled(
  member: { first_name: string },
  origin: string
): EmailBody {
  const url = `${origin}/join`
  return {
    html: htmlWrap(`
      ${hh('Your membership has ended')}
      ${hp(`Hi ${member.first_name},`)}
      ${hp("Your SharkFest membership has been cancelled and your members access has now ended. We'd love to have you back any time.")}
      ${hcta('Rejoin', url)}
    `),
    text: textWrap('SharkFest — Membership ended', `
Hi ${member.first_name},

Your SharkFest membership has been cancelled and your members access has now ended.
We'd love to have you back any time.

Rejoin: ${url}
    `),
  }
}

export function emailPartnerInvite(
  primaryName: string,
  partnerEmail: string,
  origin: string
): EmailBody {
  const url = `${origin}/login?next=/my-booking`
  return {
    html: htmlWrap(`
      ${hh("You've been added to a SharkFest booking")}
      ${hp(`Hi,`)}
      ${hp(`<strong>${primaryName}</strong> has added you as a co-holder of their SharkFest 2027 booking. You can log in with your email address (${partnerEmail}) to view the booking, track payments, and manage your camp-near preferences.`)}
      ${hp('Just click the button below and we\'ll send you a magic-link sign-in — no password needed.')}
      ${hcta('View the shared booking', url)}
    `),
    text: textWrap('SharkFest 2027 — Shared booking access', `
Hi,

${primaryName} has added you as a co-holder of their SharkFest 2027 booking.
You can log in with your email address (${partnerEmail}) to view the booking,
track payments, and manage your camp-near preferences.

Visit this link to sign in with a magic link (no password needed):
${url}
    `),
  }
}

export function emailInstalmentReminder(
  reg: { first_name: string },
  due: { id: string; label: string; amount: number; due_date: string | null },
  allInstalments: { id: string; label: string; amount: number; due_date: string | null }[],
  paidIds: Set<string>,
  origin: string,
): EmailBody {
  const url = `${origin}/my-booking`

  // Build schedule rows — mark paid with ✓, the due one with ←
  const scheduleRows: [string, string][] = allInstalments.map(i => {
    const paid = paidIds.has(i.id)
    const isCurrent = i.id === due.id
    const status = paid ? '✓ Paid' : isCurrent ? '← Due today' : fmtDate(i.due_date)
    return [i.label, `${fmtGBP(i.amount)} — ${status}`]
  })

  return {
    html: htmlWrap(`
      ${hh(`Payment due — ${due.label}`)}
      ${hp(`Hi ${reg.first_name},`)}
      ${hp(`Your <strong>${due.label}</strong> of <strong>${fmtGBP(due.amount)}</strong> for SharkFest 2027 is due today.`)}
      ${hSummary(scheduleRows)}
      ${hp('Log in to your booking page to pay securely by card.')}
      ${hcta('Pay now', url)}
    `),
    text: textWrap(`SharkFest 2027 — ${due.label} due today`, `
Hi ${reg.first_name},

Your ${due.label} of ${fmtGBP(due.amount)} for SharkFest 2027 is due today.

${tSummary(scheduleRows)}
Log in to pay: ${url}
    `),
  }
}

// ── Mailing list campaign emails ─────────────────────────────────────────────

function bodyToHtml(body: string): string {
  return body
    .split(/\n\n+/)
    .filter(p => p.trim())
    .map(para => hp(para.trim().replace(/\n/g, '<br>')))
    .join('')
}

function processBodyHtml(body: string): string {
  const trimmed = body.trim()
  // If it contains HTML tags (e.g. from the rich text editor), use it directly.
  // Otherwise treat as plain text and convert paragraphs → <p> tags.
  return /<[a-z]/i.test(trimmed) ? trimmed : bodyToHtml(trimmed)
}

export function buildCampaignEmail(
  body: string,
  contact: { first_name: string; unsubscribe_token: string },
  origin: string,
): EmailBody {
  const unsubUrl = `${origin}/unsubscribe?token=${contact.unsubscribe_token}`
  const personalised = body.replace(/\{\{first_name\}\}/g, contact.first_name || 'there')

  const unsubFooter = `<p style="margin:24px 0 0;font-size:12px;color:#94a3b8;border-top:1px solid #e2e8f0;padding-top:16px">
    You're receiving this because you're a Torbay Sharks RFC member or SharkFest registrant.
    <a href="${unsubUrl}" style="color:#94a3b8">Unsubscribe</a>
  </p>`

  // Strip HTML tags for the plain-text fallback
  const textBody = personalised.replace(/<[^>]+>/g, '').trim()

  return {
    html: htmlWrap(`${processBodyHtml(personalised)}${unsubFooter}`),
    text: `${textBody}\n\n---\nTo unsubscribe: ${unsubUrl}\n`,
  }
}

export function buildCampaignPreview(body: string): string {
  const sample = body.replace(/\{\{first_name\}\}/g, '[First name]')
  const previewFooter = `<p style="margin:24px 0 0;font-size:12px;color:#94a3b8;border-top:1px solid #e2e8f0;padding-top:16px">
    You're receiving this because you're a Torbay Sharks RFC member or SharkFest registrant.
    <span style="color:#94a3b8">Unsubscribe</span> (link included in real send)
  </p>`
  return htmlWrap(`${processBodyHtml(sample)}${previewFooter}`)
}

export function emailPaymentReminder(
  reg: { first_name: string },
  outstanding: number,
  origin: string
): EmailBody {
  const url = `${origin}/my-booking`
  return {
    html: htmlWrap(`
      ${hh('Friendly payment reminder')}
      ${hp(`Hi ${reg.first_name},`)}
      ${hp(`This is a friendly reminder that your SharkFest 2027 booking has an outstanding balance of <strong>${fmtGBP(outstanding)}</strong>.`)}
      ${hp("You can log in to your booking page to make a payment at any time. There's no requirement to pay the full balance in one go.")}
      ${hcta('Pay now', url)}
    `),
    text: textWrap('SharkFest 2027 — Friendly payment reminder', `
Hi ${reg.first_name},

This is a friendly reminder that your SharkFest 2027 booking has an
outstanding balance of ${fmtGBP(outstanding)}.

You can log in to your booking page to make a payment at any time.
There's no requirement to pay the full balance in one go.

Pay now: ${url}
    `),
  }
}
