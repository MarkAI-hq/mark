'use server'

import { fetcher } from '@/lib/fetch'
import type { ServerActionResponse } from '@/lib/types'

export interface ReferralCode {
  code: string
  referral_url: string
}

export interface ReferralInvites {
  total: number
  enrolled: number
  next_reward_at: number
  events: Array<{
    id: string
    status: string
    joined_at: string
  }>
}

export interface ReferralCredit {
  id: string
  credit_type: string
  amount_usd: string
  reason: string | null
  expires_at: string | null
  used_at: string | null
}

export async function getMyReferralCode(): Promise<ServerActionResponse<ReferralCode>> {
  return fetcher<ReferralCode>('/referrals/my-code')
}

export async function getMyInvites(): Promise<ServerActionResponse<ReferralInvites>> {
  return fetcher<ReferralInvites>('/referrals/my-invites')
}

export async function getMyCredits(): Promise<
  ServerActionResponse<ReferralCredit[]>
> {
  return fetcher<ReferralCredit[]>('/referrals/my-credits')
}
