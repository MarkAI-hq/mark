// src/lib/billing-utils.ts
// ── NO 'use server' — safe to import in both client and server components ──

export type BillingRegion = 'global' | 'east_africa'

const EAST_AFRICA_TIMEZONES = new Set([
  'Africa/Nairobi',
  'Africa/Kampala',
  'Africa/Dar_es_Salaam',
  'Africa/Kigali',
  'Africa/Bujumbura',
  'Africa/Addis_Ababa',
  'Africa/Juba',
])

export function detectRegion(timezone?: string): BillingRegion {
  const tz = timezone ?? Intl.DateTimeFormat().resolvedOptions().timeZone
  return EAST_AFRICA_TIMEZONES.has(tz) ? 'east_africa' : 'global'
}

export const REGIONAL_PRICES: Record<BillingRegion, {
  monthly:       number
  annual:        number
  annualMonthly: number
}> = {
  global:      { monthly: 79,  annual: 708, annualMonthly: 59 },
  east_africa: { monthly: 39,  annual: 384, annualMonthly: 32 },
}