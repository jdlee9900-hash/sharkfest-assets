import { NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { adminEmails } from '@/lib/types'
import ExcelJS from 'exceljs'

// Build a worksheet from an array of plain row objects (keys become headers).
function addSheet(wb: ExcelJS.Workbook, name: string, rows: Record<string, string | number>[]) {
  const ws = wb.addWorksheet(name)
  if (rows.length === 0) return
  const headers = Object.keys(rows[0])
  ws.columns = headers.map(h => ({ header: h, key: h }))
  ws.addRows(rows)
}

function fmtDate(iso: string | null): string {
  if (!iso) return ''
  return new Date(iso).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
}

function fmtAmount(pence: number | null | undefined): string {
  if (pence == null) return ''
  return (pence / 100).toFixed(2)
}

export async function GET(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user || !adminEmails().includes(user.email!)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const url = new URL(request.url)
  const format = url.searchParams.get('format') === 'xlsx' ? 'xlsx' : 'csv'

  const service = createServiceClient()
  const [regRes, planRes, payRes] = await Promise.all([
    service.from('registrations').select('*').order('created_at', { ascending: false }),
    service.from('payment_plans').select('*'),
    service.from('payments').select('*'),
  ])

  const registrations = regRes.data ?? []
  const plans         = planRes.data ?? []
  const payments      = payRes.data ?? []

  // Index plans and payments by registration_id for O(1) lookups
  const nameByRegId = new Map(registrations.map(r => [r.id, `${r.first_name} ${r.surname}`.trim()]))
  const planByReg = new Map(plans.map(p => [p.registration_id, p]))
  const paysByReg = new Map<string, typeof payments>()
  for (const p of payments) {
    const list = paysByReg.get(p.registration_id) ?? []
    list.push(p)
    paysByReg.set(p.registration_id, list)
  }

  // ── Bookings sheet ──────────────────────────────────────────────────────────
  const bookingRows = registrations.map(r => {
    const plan  = planByReg.get(r.id)
    const pays  = paysByReg.get(r.id) ?? []
    const paid  = pays.filter(p => p.status === 'paid').reduce((s, p) => s + p.amount, 0)
    const outstanding = plan ? plan.total_amount - paid : null
    const lastPaid = pays
      .filter(p => p.status === 'paid' && p.paid_at)
      .sort((a, b) => new Date(b.paid_at!).getTime() - new Date(a.paid_at!).getTime())[0]

    return {
      'Registration ID':   r.id,
      'Event Year':        r.year,
      'First Name':        r.first_name,
      'Surname':           r.surname,
      'Email':             r.email,
      'Mobile':            r.mobile,
      'Adults':            r.adults,
      'Kids':              r.kids,
      'Accommodation':     r.accommodation,
      'Electric Hookup':   r.electric_hookup ? 'Yes' : 'No',
      'Camp Near 1':       r.camp_near_1 ? (nameByRegId.get(r.camp_near_1) ?? '') : '',
      'Camp Near 2':       r.camp_near_2 ? (nameByRegId.get(r.camp_near_2) ?? '') : '',
      'Vehicle Reg':       r.vehicle_reg ?? '',
      'Notes':             r.notes ?? '',
      'Status':            r.status,
      'Admin Notes':       r.admin_notes ?? '',
      'Registered At':     fmtDate(r.created_at),
      'Plan Total (£)':    plan ? fmtAmount(plan.total_amount) : '',
      'Plan Notes':        plan?.notes ?? '',
      'Allocated By':      plan?.allocated_by ?? '',
      'Allocated At':      fmtDate(plan?.allocated_at ?? null),
      'Total Paid (£)':    paid > 0 ? fmtAmount(paid) : '0.00',
      'Outstanding (£)':   outstanding != null ? fmtAmount(outstanding) : '',
      'Payments Made':     pays.filter(p => p.status === 'paid').length,
      'Last Payment Date': fmtDate(lastPaid?.paid_at ?? null),
    }
  })

  if (format === 'csv') {
    if (bookingRows.length === 0) {
      return new Response('No registrations found', { status: 200, headers: { 'Content-Type': 'text/plain' } })
    }
    const headers = Object.keys(bookingRows[0])
    const escapeCell = (v: string | number) => {
      const s = String(v)
      return s.includes(',') || s.includes('"') || s.includes('\n') ? `"${s.replace(/"/g, '""')}"` : s
    }
    const csv = [
      headers.map(escapeCell).join(','),
      ...bookingRows.map(row => headers.map(h => escapeCell((row as Record<string, string | number>)[h])).join(','))
    ].join('\r\n')

    return new Response(csv, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="sharkfest-bookings-${new Date().toISOString().slice(0, 10)}.csv"`,
      },
    })
  }

  // ── Payments sheet ──────────────────────────────────────────────────────────
  const regById = new Map(registrations.map(r => [r.id, r]))
  const paymentRows = payments.map(p => {
    const reg = regById.get(p.registration_id)
    return {
      'Payment ID':       p.id,
      'Registration ID':  p.registration_id,
      'Name':             reg ? `${reg.first_name} ${reg.surname}` : '',
      'Email':            reg?.email ?? '',
      'Amount (£)':       fmtAmount(p.amount),
      'Status':           p.status,
      'Paid At':          fmtDate(p.paid_at),
      'Created At':       fmtDate(p.created_at),
      'Stripe Intent ID': p.stripe_payment_intent_id ?? '',
    }
  })

  const wb = new ExcelJS.Workbook()
  addSheet(wb, 'Bookings', bookingRows)
  addSheet(wb, 'Payments', paymentRows)

  const buf = await wb.xlsx.writeBuffer()

  return new Response(buf, {
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="sharkfest-export-${new Date().toISOString().slice(0, 10)}.xlsx"`,
    },
  })
}
