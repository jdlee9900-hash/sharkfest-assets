import { NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import type { AccommodationType } from '@/lib/types'

const ACCOMMODATION_TYPES: AccommodationType[] = ['Tent', 'Caravan', 'Mobile Home', 'Campervan']

export async function PATCH(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

  const service = createServiceClient()

  // Only the primary booking holder can edit — not a partner user.
  const { data: registration } = await service
    .from('registrations')
    .select('id')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (!registration) return NextResponse.json({ error: 'No registration found' }, { status: 404 })

  const body = await request.json().catch(() => ({}))

  const first_name = typeof body.first_name === 'string' ? body.first_name.trim() : null
  const surname    = typeof body.surname    === 'string' ? body.surname.trim()    : null
  const mobile     = typeof body.mobile     === 'string' ? body.mobile.trim()     : null

  if (!first_name || !surname || !mobile) {
    return NextResponse.json({ error: 'Name and mobile are required' }, { status: 400 })
  }

  const adults = Number(body.adults)
  const kids   = Number(body.kids)
  if (!Number.isInteger(adults) || adults < 1) {
    return NextResponse.json({ error: 'At least 1 adult is required' }, { status: 400 })
  }
  if (!Number.isInteger(kids) || kids < 0) {
    return NextResponse.json({ error: 'Invalid number of children' }, { status: 400 })
  }

  const accommodation: AccommodationType = body.accommodation
  if (!ACCOMMODATION_TYPES.includes(accommodation)) {
    return NextResponse.json({ error: 'Invalid accommodation type' }, { status: 400 })
  }

  const electric_hookup = body.electric_hookup === true || body.electric_hookup === 'true'
  const vehicle_reg = typeof body.vehicle_reg === 'string' ? body.vehicle_reg.trim() || null : null
  const notes       = typeof body.notes       === 'string' ? body.notes.trim()       || null : null

  const { data: updated, error } = await service
    .from('registrations')
    .update({ first_name, surname, mobile, adults, kids, accommodation, electric_hookup, vehicle_reg, notes, updated_at: new Date().toISOString() })
    .eq('id', registration.id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: 'Could not save changes' }, { status: 500 })

  return NextResponse.json(updated)
}
