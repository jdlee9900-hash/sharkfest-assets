import { NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { adminEmails } from '@/lib/types'

const DEPOSIT_AMOUNT = 5000 // £50 in pence

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user || !adminEmails().includes(user.email!)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { registration_id, total_amount, notes } = await request.json()
  if (!registration_id || !total_amount) {
    return NextResponse.json({ error: 'Invalid input' }, { status: 400 })
  }

  const service = createServiceClient()

  // Check if a plan already exists for this registration
  const { data: existing } = await service
    .from('payment_plans')
    .select('id')
    .eq('registration_id', registration_id)
    .maybeSingle()

  let plan: { id: string } | null = null
  let planErr = null

  if (existing) {
    // Update the total and notes only — don't touch the deposit instalment
    const { data, error } = await service
      .from('payment_plans')
      .update({
        total_amount: Math.round(total_amount),
        notes: notes?.trim() || null,
        allocated_by: user.email,
        allocated_at: new Date().toISOString(),
      })
      .eq('id', existing.id)
      .select('id')
      .single()
    plan = data
    planErr = error
  } else {
    // Create new plan
    const { data, error } = await service
      .from('payment_plans')
      .insert({
        registration_id,
        total_amount: Math.round(total_amount),
        notes: notes?.trim() || null,
        allocated_by: user.email,
      })
      .select('id')
      .single()
    plan = data
    planErr = error

    // Auto-create deposit instalment on first allocation
    if (!error && data) {
      await service.from('instalments').insert({
        payment_plan_id: data.id,
        registration_id,
        label: 'Deposit',
        amount: DEPOSIT_AMOUNT,
        due_date: null,
      })
    }
  }

  if (planErr || !plan) {
    return NextResponse.json({ error: planErr?.message ?? 'Failed to save plan' }, { status: 500 })
  }

  return NextResponse.json({ ok: true, plan_id: plan.id })
}
