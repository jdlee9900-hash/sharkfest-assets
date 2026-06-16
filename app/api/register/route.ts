import { NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { sendEmail, emailRegistrationUser, emailRegistrationAdmin, emailPartnerInvite, getOrigin, getAdminEmails } from '@/lib/email'
import { rateLimit, clientIp } from '@/lib/rate-limit'
import { getEvent } from '@/lib/events'
import { isActiveMemberOrPartner } from '@/lib/membership'
import { isInstalmentAvailable } from '@/lib/instalments'
import { getPricing } from '@/lib/pricing-server'
import { normaliseTickets, totalAttendees, festivalTotal, normaliseFoodPreferences, summariseFood } from '@/lib/pricing'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export async function POST(request: Request) {
  try {
    // Public endpoint that writes to the DB and sends email — throttle abuse.
    const limit = rateLimit(`register:${clientIp(request)}`, 5, 10 * 60_000)
    if (!limit.ok) {
      return NextResponse.json(
        { error: 'Too many attempts — please wait a few minutes and try again.' },
        { status: 429, headers: { 'Retry-After': String(limit.retryAfterSeconds) } }
      )
    }

    const body = await request.json()
    const {
      first_name, surname, email, mobile,
      adults, kids, accommodation, electric_hookup,
      vehicle_reg, notes, company, year, camp_near, partner_email,
      tickets: rawTickets, food_preference: rawFood, food_preferences: rawFoodPrefs,
      payment_method: rawPaymentMethod,
    } = body

    // Validate and normalise payment method. Default to 'full' if not supplied.
    const paymentMethod: 'full' | 'instalments' =
      rawPaymentMethod === 'instalments' ? 'instalments' : 'full'

    // Resolve which festival this registration is for. Unknown/missing years
    // fall back to the default event, so older clients keep working.
    const event = getEvent(year)

    // Honeypot: a filled hidden field means a bot. Pretend success, write nothing.
    if (typeof company === 'string' && company.trim() !== '') {
      return NextResponse.json({ id: 'ok' })
    }

    // Members-only events (e.g. the 2027 25th anniversary) can only be booked by a
    // logged-in active member. Enforce server-side and tie the booking to them.
    let userId: string | null = null
    if (event.membersOnly) {
      const supabase = await createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        return NextResponse.json(
          { error: 'Please sign in to register for this members-only event.' },
          { status: 401 }
        )
      }
      if (!(await isActiveMemberOrPartner(user.id))) {
        return NextResponse.json(
          { error: `${event.name} registration is exclusive to members. Join the club to book your pitch.` },
          { status: 403 }
        )
      }
      userId = user.id
    }

    if (!first_name?.trim() || !surname?.trim() || !email?.trim() || !mobile?.trim()) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }
    if (!EMAIL_RE.test(email.trim()) || email.trim().length > 254) {
      return NextResponse.json({ error: 'Please enter a valid email address' }, { status: 400 })
    }
    if (!['Tent', 'Caravan', 'Mobile Home', 'Campervan'].includes(accommodation)) {
      return NextResponse.json({ error: 'Invalid accommodation type' }, { status: 400 })
    }

    const service = createServiceClient()

    // Tickets drive party size and the estimated total. Recompute the total from
    // the server's own pricing — never trust a client-supplied amount. Older
    // clients without `tickets` fall back to the plain adults/kids fields.
    const pricing = await getPricing()
    const hasTickets = rawTickets && typeof rawTickets === 'object'
    const tickets = hasTickets ? normaliseTickets(rawTickets) : null
    const partyFromTickets = tickets ? totalAttendees(tickets) : null
    const estimatedTotal = tickets ? festivalTotal(tickets, pricing.festival) : null

    // Clamp counts and cap free-text so a single request can't store absurd values.
    const parsedAdults = partyFromTickets
      ? Math.min(60, partyFromTickets.adults)
      : Math.min(20, Math.max(1, parseInt(adults) || 1))
    const parsedKids = partyFromTickets
      ? Math.min(60, partyFromTickets.kids)
      : Math.min(20, Math.max(0, parseInt(kids) || 0))

    if (parsedAdults + parsedKids < 1) {
      return NextResponse.json({ error: 'Please add at least one person to your booking.' }, { status: 400 })
    }

    // Per-person food preferences (one entry per attendee), validated against the
    // options the admin currently offers. Older clients may send a single
    // `food_preference` string instead — keep that working as a summary.
    const foodPreferences = normaliseFoodPreferences(rawFoodPrefs, parsedAdults, parsedKids, pricing.foodOptions)
    const hasFoodChoices = foodPreferences.some(p => p.choice)
    const foodSummary = hasFoodChoices
      ? summariseFood(foodPreferences)
      : (typeof rawFood === 'string' && pricing.foodOptions.includes(rawFood.trim()) ? rawFood.trim() : null)

    const parsedHookup = Boolean(electric_hookup)
    const cap = (v: unknown, n: number) =>
      typeof v === 'string' && v.trim() ? v.trim().slice(0, n) : null

    // "Camp near" — up to two existing registrations for the same event. Validate
    // the ids really exist for this year before storing, and never trust order/count.
    const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    const requested = Array.isArray(camp_near)
      ? [...new Set(camp_near.filter((v: unknown): v is string => typeof v === 'string' && UUID_RE.test(v)))].slice(0, 2)
      : []
    let campNear1: string | null = null
    let campNear2: string | null = null
    if (requested.length > 0) {
      const { data: matches } = await service
        .from('registrations')
        .select('id')
        .eq('year', event.year)
        .in('id', requested)
      const valid = requested.filter(id => (matches ?? []).some(m => m.id === id))
      campNear1 = valid[0] ?? null
      campNear2 = valid[1] ?? null
    }

    const { data, error } = await service
      .from('registrations')
      .insert({
        first_name: first_name.trim().slice(0, 100),
        surname: surname.trim().slice(0, 100),
        email: email.trim().toLowerCase().slice(0, 254),
        mobile: mobile.trim().slice(0, 30),
        adults: parsedAdults,
        kids: parsedKids,
        accommodation,
        electric_hookup: parsedHookup,
        vehicle_reg: cap(vehicle_reg, 16),
        notes: cap(notes, 1000),
        year: event.year,
        status: 'pending',
        // New booking fields — only sent when present so older databases without
        // the 0011 migration keep working.
        ...(tickets ? { tickets } : {}),
        ...(hasFoodChoices ? { food_preferences: foodPreferences } : {}),
        ...(foodSummary ? { food_preference: foodSummary } : {}),
        ...(estimatedTotal != null ? { estimated_total: estimatedTotal } : {}),
        // Only sent when chosen, so registrations without a pick keep working
        // even before the camp_near migration (0004) is applied.
        ...(campNear1 ? { camp_near_1: campNear1 } : {}),
        ...(campNear2 ? { camp_near_2: campNear2 } : {}),
        ...(userId ? { user_id: userId } : {}),
        ...(typeof partner_email === 'string' && EMAIL_RE.test(partner_email.trim()) && partner_email.trim().toLowerCase() !== email.trim().toLowerCase()
          ? { partner_email: partner_email.trim().toLowerCase().slice(0, 254) }
          : {}),
        // Only store 'instalments' if the cut-off hasn't passed; silently
        // fall back to 'full' if someone submits an outdated form.
        payment_method: paymentMethod === 'instalments' && isInstalmentAvailable(new Date()) ? 'instalments' : 'full',
      })
      .select('id, email, first_name, surname, mobile, adults, kids, accommodation, electric_hookup')
      .single()

    if (error) throw error

    const origin = getOrigin()
    const admins = getAdminEmails()
    const partnerEmailClean = typeof partner_email === 'string' && EMAIL_RE.test(partner_email.trim())
      && partner_email.trim().toLowerCase() !== email.trim().toLowerCase()
      ? partner_email.trim().toLowerCase()
      : null

    await Promise.allSettled([
      sendEmail(data.email, `${event.name} — Registration received`, emailRegistrationUser(data, origin, event, paymentMethod)),
      ...admins.map(to =>
        sendEmail(to, `New ${event.name} registration: ${data.first_name} ${data.surname}`, emailRegistrationAdmin({ ...data, food_preference: foodSummary, estimated_total: estimatedTotal }, origin, event))
      ),
      ...(partnerEmailClean
        ? [sendEmail(partnerEmailClean, `${event.name} — You've been added to a booking`, emailPartnerInvite(`${data.first_name} ${data.surname}`, partnerEmailClean, origin))]
        : []),
    ])

    return NextResponse.json({ id: data.id })
  } catch (err) {
    console.error('Registration error:', err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Registration failed' },
      { status: 500 }
    )
  }
}
