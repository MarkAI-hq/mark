// src/lib/types/billing.ts

export type PlanTier      = 'free' | 'pro' | 'enterprise'
export type PlanStatus    = 'trialing' | 'active' | 'past_due' | 'cancelled' | 'inactive'
export type BillingRegion = 'global' | 'east_africa'

// Timezones that qualify for East Africa pricing
const EAST_AFRICA_TIMEZONES = new Set([
  'Africa/Nairobi',       // Kenya + Uganda (shared)
  'Africa/Kampala',       // Uganda
  'Africa/Dar_es_Salaam', // Tanzania
  'Africa/Kigali',        // Rwanda
  'Africa/Bujumbura',     // Burundi
  'Africa/Addis_Ababa',   // Ethiopia
  'Africa/Juba',          // South Sudan
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

export interface Subscription {
  subscription_id:        string
  organization_id:        string
  plan:                   PlanTier
  status:                 PlanStatus
  trial_ends_at:          string | null
  current_period_start:   string | null
  current_period_end:     string | null
  stripe_customer_id:     string | null
  stripe_subscription_id: string | null
  student_count:          number
  cancelled_at:           string | null
  is_trialing:            boolean
  limits: {
    students:  number
    aiGrading: boolean
    reports:   boolean
    watermark: boolean
  }
  createdAt: string
  updatedAt: string
}

export interface CheckoutResponse {
  url:        string
  session_id: string
}

export interface PortalResponse {
  url: string
}