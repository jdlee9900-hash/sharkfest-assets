import nodemailer from 'nodemailer'

export function getOrigin(): string {
  return process.env.NEXT_PUBLIC_SITE_URL ?? 'https://sharkfest.vercel.app'
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
    console.error('[email] SMTP_USER or SMTP_PASS not set — email not sent:', subject)
    return
  }

  const from = process.env.EMAIL_FROM ?? `SharkFest <${process.env.SMTP_USER}>`

  try {
    await transporter.sendMail({
      from,
      to: Array.isArray(to) ? to.join(', ') : to,
      subject,
      html: body.html,
      text: body.text,
    })
  } catch (err) {
    console.error('[email] SMTP send failed — subject:', subject, '— to:', to, '— error:', err)
  }
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

function htmlWrap(body: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>SharkFest 2028</title></head>
<body style="margin:0;padding:0;background:#f1f5f9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;color:#0f172a;-webkit-font-smoothing:antialiased">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f1f5f9;padding:40px 16px">
  <tr><td align="center">
    <table cellpadding="0" cellspacing="0" style="width:100%;max-width:540px">
      <tr><td style="background:#0f172a;border-radius:8px 8px 0 0;padding:24px 32px">
        <p style="margin:0 0 4px;font-size:11px;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;color:#fbbf24">Torbay Sharks RFC</p>
        <p style="margin:0;font-size:22px;font-weight:700;color:#ffffff;letter-spacing:-0.01em">SharkFest 2028</p>
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
  origin: string
): EmailBody {
  const url = `${origin}/my-booking`
  return {
    html: htmlWrap(`
      ${hh('Registration received')}
      ${hp(`Hi ${reg.first_name},`)}
      ${hp("Thank you for registering for SharkFest 2028. We've received your details and will review your booking shortly.")}
      ${hp("Once reviewed, we'll set up a payment plan and send you the total cost with instructions on how to pay the deposit to secure your place.")}
      ${hp('You can check your booking status at any time:')}
      ${hcta('View my booking', url)}
    `),
    text: textWrap('SharkFest 2028 — Registration received', `
Hi ${reg.first_name},

Thank you for registering for SharkFest 2028. We've received your details
and will review your booking shortly.

Once reviewed, we'll set up a payment plan and send you the total cost with
instructions on how to pay the deposit to secure your place.

View your booking: ${url}
    `),
  }
}

export function emailRegistrationAdmin(
  reg: { id: string; first_name: string; surname: string; email: string; mobile: string; adults: number; kids: number; accommodation: string; electric_hookup: boolean },
  origin: string
): EmailBody {
  const party = `${reg.adults} adult${reg.adults !== 1 ? 's' : ''}${reg.kids ? `, ${reg.kids} child${reg.kids !== 1 ? 'ren' : ''}` : ''}`
  const accom = `${reg.accommodation}${reg.electric_hookup ? ' + electric hookup' : ''}`
  const url   = `${origin}/admin`
  return {
    html: htmlWrap(`
      ${hh('New registration')}
      ${hp('A new registration has been submitted and is awaiting review.')}
      ${hSummary([
        ['Name',          `${reg.first_name} ${reg.surname}`],
        ['Email',         reg.email],
        ['Mobile',        reg.mobile],
        ['Party',         party],
        ['Accommodation', accom],
      ])}
      ${hcta('Open admin panel', url)}
    `),
    text: textWrap('SharkFest 2028 — New registration', `
A new registration is awaiting review.

${tSummary([
  ['Name',          `${reg.first_name} ${reg.surname}`],
  ['Email',         reg.email],
  ['Mobile',        reg.mobile],
  ['Party',         party],
  ['Accommodation', accom],
])}
Admin panel: ${url}
    `),
  }
}

export function emailPlanAllocated(
  reg: { first_name: string },
  plan: { total_amount: number; notes: string | null },
  origin: string
): EmailBody {
  const remaining = Math.max(0, plan.total_amount - 5000)
  const url = `${origin}/my-booking`
  const summaryRows: [string, string][] = [
    ['Total cost',        fmtGBP(plan.total_amount)],
    ['Deposit due now',   '£50.00'],
    ['Remaining balance', fmtGBP(remaining)],
    ...(plan.notes ? [['Notes', plan.notes] as [string, string]] : []),
  ]
  return {
    html: htmlWrap(`
      ${hh('Your payment plan is ready')}
      ${hp(`Hi ${reg.first_name},`)}
      ${hp('Your SharkFest 2028 booking has been reviewed and your payment plan is now set up.')}
      ${hSummary(summaryRows)}
      ${hp('To secure your place, please pay the <strong>£50 deposit</strong> as soon as possible. You can pay the remaining balance at any time in amounts that suit you.')}
      ${hcta('Pay deposit now', url)}
    `),
    text: textWrap('SharkFest 2028 — Your payment plan is ready', `
Hi ${reg.first_name},

Your SharkFest 2028 booking has been reviewed and your payment plan is now set up.

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
    : "Your balance is now fully paid — nothing more to do. We look forward to seeing you at SharkFest 2028!"
  return {
    html: htmlWrap(`
      ${hh('Payment confirmed')}
      ${hp(`Hi ${reg.first_name},`)}
      ${hp("We've received your payment. Here's a summary:")}
      ${hSummary(summaryRows)}
      ${hp(outstanding > 0
        ? `You have an outstanding balance of <strong>${fmtGBP(outstanding)}</strong>. You can pay this at any time through your booking page.`
        : "Your balance is now fully paid — nothing more to do. We look forward to seeing you at SharkFest 2028!"
      )}
      ${hcta('View my booking', url)}
    `),
    text: textWrap('SharkFest 2028 — Payment confirmed', `
Hi ${reg.first_name},

We've received your payment. Here's a summary:

${tSummary(summaryRows)}
${bodyNote}

View your booking: ${url}
    `),
  }
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
      ${hp(`This is a friendly reminder that your SharkFest 2028 booking has an outstanding balance of <strong>${fmtGBP(outstanding)}</strong>.`)}
      ${hp("You can log in to your booking page to make a payment at any time. There's no requirement to pay the full balance in one go.")}
      ${hcta('Pay now', url)}
    `),
    text: textWrap('SharkFest 2028 — Friendly payment reminder', `
Hi ${reg.first_name},

This is a friendly reminder that your SharkFest 2028 booking has an
outstanding balance of ${fmtGBP(outstanding)}.

You can log in to your booking page to make a payment at any time.
There's no requirement to pay the full balance in one go.

Pay now: ${url}
    `),
  }
}
