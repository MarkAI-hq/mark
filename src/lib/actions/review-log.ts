'use server'

import { fetcher } from '@/lib/fetch'
import type { ServerActionResponse } from '@/lib/types'

export interface ReviewItem {
  id: string
  plan_id: string | null
  subject: string
  topic: string
  text: string
  source: 'missed' | 'self'
  status: 'open' | 'resolved'
  due_at: string
  created_at: string
}

export interface ReviewLogInput {
  text: string
  source: 'missed' | 'self'
}

export async function saveReviewLog(
  planId: string,
  items: ReviewLogInput[],
): Promise<ServerActionResponse<{ saved: number; due_at: string | null; next_review_date: string | null }>> {
  return fetcher(`/review-log/plans/${planId}`, {
    method: 'POST',
    body: JSON.stringify({ items }),
    cache: 'no-store',
  })
}

export async function getReviewItems(): Promise<ServerActionResponse<ReviewItem[]>> {
  return fetcher<ReviewItem[]>('/review-log/items', { cache: 'no-store' })
}

export async function setReviewItemStatus(
  id: string,
  status: 'open' | 'resolved',
): Promise<ServerActionResponse<{ id: string; status: string }>> {
  return fetcher(`/review-log/items/${id}`, {
    method: 'PATCH',
    body: JSON.stringify({ status }),
    cache: 'no-store',
  })
}
