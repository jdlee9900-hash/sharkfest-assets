// Server-only reader/writer for the editable site pricing. Kept separate from
// `lib/pricing.ts` so the shared types/helpers stay safe to import on the client
// (only server components and route handlers import this module).
import { createServiceClient } from '@/lib/supabase/server'
import { DEFAULT_PRICING, mergePricing, type SitePricing } from '@/lib/pricing'

/** Current pricing, falling back to defaults if the table/row is missing. */
export async function getPricing(): Promise<SitePricing> {
  try {
    const service = createServiceClient()
    const { data } = await service
      .from('site_pricing')
      .select('data')
      .eq('id', 1)
      .maybeSingle()
    return mergePricing(data?.data)
  } catch {
    return DEFAULT_PRICING
  }
}

/** Persist a (validated/merged) pricing blob. Returns the stored value. */
export async function savePricing(raw: unknown, updatedBy: string | null): Promise<SitePricing> {
  const merged = mergePricing(raw)
  const service = createServiceClient()
  await service.from('site_pricing').upsert({
    id: 1,
    data: merged,
    updated_at: new Date().toISOString(),
    updated_by: updatedBy,
  }, { onConflict: 'id' })
  return merged
}
