import { NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { adminEmails } from '@/lib/types'

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user || !adminEmails().includes(user.email!)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { registration_id, total_amount, notes, instalments } = await request.json()
  if (!registration_id || !total_amount || !Array.isArray(instalments)) {
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
  }

  if (planErr || !plan) {
    return NextResponse.json({ error: planErr?.message ?? 'Failed to create plan' }, { status: 500 })
  }

  // Delete old instalments and re-insert
  await service.from('instalments').delete().eq('payment_plan_id', plan.id)

  if (instalments.length > 0) {
    const rows = instalments.map((ins: { label: string; amount: number; due_date: string }) => ({
      payment_plan_id: plan.id,
      registration_id,
      label: ins.label?.trim() || 'Payment',
      amount: Math.round(ins.amount),
      due_date: ins.due_date || null,
    }))
    const { error: insErr } = await service.from('instalments').insert(rows)
    if (insErr) return NextResponse.json({ error: insErr.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true, plan_id: plan.id })
}
