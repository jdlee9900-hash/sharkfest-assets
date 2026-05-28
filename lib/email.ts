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
    host: process.env.SMTP_HOST ?? 'smtp.gmail.com',
    port: Number(process.env.SMTP_PORT ?? 587),
    secure: false, // STARTTLS on port 587
    auth: { user, pass },
  })
}

export async function sendEmail(to: string | string[], subject: string, html: string): Promise<void> {
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
      html,
    })
  } catch (err) {
    console.error('[email] SMTP send failed — subject:', subject, '— to:', to, '— error:', err)
  }
}


// ── Helpers ──────────────────────────────────────────────────────────────────

function fmtGBP(pence: number): string {
  return `£${(pence / 100).toFixed(2)}`
}

function fmtDate(iso: string | null | undefined): string {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
}

function wrap(body: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>SharkFest 2028</title></head>
<body style="margin:0;padding:0;background:#f1f5f9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;color:#0f172a;-webkit-font-smoothing:antialiased">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f1f5f9;padding:40px 16px">
  <tr><td align="center">
    <table cellpadding="0" cellspacing="0" style="width:100%;max-width:540px">

      <!-- Header -->
      <tr><td style="background:#0f172a;border-radius:8px 8px 0 0;padding:24px 32px">
        <p style="margin:0 0 4px;font-size:11px;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;color:#fbbf24">Torbay Sharks RFC</p>
        <p style="margin:0;font-size:22px;font-weight:700;color:#ffffff;letter-spacing:-0.01em">SharkFest 2028</p>
      </td></tr>

      <!-- Body -->
      <tr><td style="background:#ffffff;padding:32px">
        ${body}
      </td></tr>

      <!-- Footer -->
      <tr><td style="background:#ffffff;border-top:1px solid #e2e8f0;border-radius:0 0 8px 8px;padding:16px 32px 24px">
        <p style="margin:0;font-size:12px;color:#94a3b8;line-height:1.6">
          Torbay Sharks RFC · Devon Coast<br>
          Questions? Email us at <a href="mailto:sharkfest2025@gmail.com" style="color:#94a3b8">sharkfest2025@gmail.com</a>
        </p>
      </td></tr>

    </table>
  </td></tr>
</table>
</body></html>`
}

function p(text: string): string {
  return `<p style="margin:0 0 16px;font-size:15px;line-height:1.65;color:#0f172a">${text}</p>`
}

function h(text: string): string {
  return `<h1 style="margin:0 0 20px;font-size:21px;font-weight:700;color:#0f172a">${text}</h1>`
}

function cta(label: string, url: string): string {
  return `<p style="margin:24px 0 0">
    <a href="${url}" style="display:inline-block;background:#fbbf24;color:#0f172a;font-size:14px;font-weight:700;padding:12px 24px;border-radius:6px;text-decoration:none">${label}</a>
  </p>
  <p style="margin:10px 0 0;font-size:12px;color:#94a3b8">Or copy this link: <a href="${url}" style="color:#64748b">${url}</a></p>`
}

function summaryBox(rows: [string, string][]): string {
  const cells = rows.map(([label, value]) =>
    `<tr>
      <td style="padding:8px 16px 8px 0;font-size:13px;color:#64748b;white-space:nowrap;vertical-align:top">${label}</td>
      <td style="padding:8px 0;font-size:14px;font-weight:600;color:#0f172a">${value}</td>
    </tr>`
  ).join('')
  return `<table cellpadding="0" cellspacing="0" style="width:100%;background:#f8fafc;border-radius:6px;padding:8px 16px;margin:0 0 20px">${cells}</table>`
}

// ── Templates ─────────────────────────────────────────────────────────────────

/** Sent to the registrant immediately after they submit the form */
export function emailRegistrationUser(
  reg: { first_name: string; surname: string },
  origin: string
): string {
  return wrap(`
    ${h('Registration received')}
    ${p(`Hi ${reg.first_name},`)}
    ${p('Thank you for registering for SharkFest 2028. We\'ve received your details and will review your booking shortly.')}
    ${p('Once reviewed, we\'ll set up a payment plan for your booking and send you details of the total cost along with instructions on how to pay the deposit to secure your place.')}
    ${p('You can check your booking status at any time by signing in below:')}
    ${cta('View my booking', `${origin}/my-booking`)}
  `)
}

/** Sent to admins when a new registration comes in */
export function emailRegistrationAdmin(
  reg: { id: string; first_name: string; surname: string; email: string; mobile: string; adults: number; kids: number; accommodation: string; electric_hookup: boolean },
  origin: string
): string {
  return wrap(`
    ${h('New registration')}
    ${p('A new registration has been submitted and is awaiting review.')}
    ${summaryBox([
      ['Name',          `${reg.first_name} ${reg.surname}`],
      ['Email',         reg.email],
      ['Mobile',        reg.mobile],
      ['Party',         `${reg.adults} adult${reg.adults !== 1 ? 's' : ''}${reg.kids ? `, ${reg.kids} child${reg.kids !== 1 ? 'ren' : ''}` : ''}`],
      ['Accommodation', `${reg.accommodation}${reg.electric_hookup ? ' + electric hookup' : ''}`],
    ])}
    ${cta('Open admin panel', `${origin}/admin`)}
  `)
}

/** Sent to the registrant when admin allocates a payment plan */
export function emailPlanAllocated(
  reg: { first_name: string },
  plan: { total_amount: number; notes: string | null },
  origin: string
): string {
  const remaining = Math.max(0, plan.total_amount - 5000)
  return wrap(`
    ${h('Your payment plan is ready')}
    ${p(`Hi ${reg.first_name},`)}
    ${p('Your SharkFest 2028 booking has been reviewed and your payment plan is now set up.')}
    ${summaryBox([
      ['Total cost',       fmtGBP(plan.total_amount)],
      ['Deposit due now',  '£50.00'],
      ['Remaining balance', fmtGBP(remaining)],
      ...(plan.notes ? [['Notes', plan.notes] as [string, string]] : []),
    ])}
    ${p('To secure your place, please pay the <strong>£50 deposit</strong> as soon as possible. You can pay the remaining balance at any time in amounts that suit you before the event.')}
    ${cta('Pay deposit now', `${origin}/my-booking`)}
  `)
}

/** Sent to the registrant when a payment is confirmed by Stripe */
export function emailPaymentReceipt(
  reg: { first_name: string },
  amount: number,
  paidAt: string | null,
  outstanding: number,
  origin: string
): string {
  return wrap(`
    ${h('Payment confirmed')}
    ${p(`Hi ${reg.first_name},`)}
    ${p('We\'ve received your payment. Here\'s a summary:')}
    ${summaryBox([
      ['Amount paid',       fmtGBP(amount)],
      ['Date',              fmtDate(paidAt)],
      ['Outstanding balance', outstanding > 0 ? fmtGBP(outstanding) : 'Paid in full ✓'],
    ])}
    ${outstanding > 0
      ? p(`You have an outstanding balance of <strong>${fmtGBP(outstanding)}</strong>. You can pay this at any time through your booking page.`)
      : p('Your balance is now fully paid — nothing more to do. We look forward to seeing you at SharkFest 2028!')
    }
    ${cta('View my booking', `${origin}/my-booking`)}
  `)
}

/** Sent to the registrant when an admin triggers a payment reminder */
export function emailPaymentReminder(
  reg: { first_name: string },
  outstanding: number,
  origin: string
): string {
  return wrap(`
    ${h('Friendly payment reminder')}
    ${p(`Hi ${reg.first_name},`)}
    ${p(`This is a friendly reminder that your SharkFest 2028 booking has an outstanding balance of <strong>${fmtGBP(outstanding)}</strong>.`)}
    ${p('You can log in to your booking page to make a payment at any time. There\'s no requirement to pay the full balance in one go.')}
    ${cta('Pay now', `${origin}/my-booking`)}
  `)
}
