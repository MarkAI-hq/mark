'use server'

import { fetcher } from '@/lib/fetch'

export interface WelcomePackOrder {
  id: string
  student_id: string
  org_id: string
  status: 'pending' | 'paid' | 'processing' | 'shipped' | 'delivered' | 'cancelled'
  stripe_payment_id?: string | null
  printful_order_id?: string | null
  tracking_number?: string | null
  pack_price_usd: string
  ordered_at?: string | null
  createdAt: string
}

export interface ShippingAddress {
  name: string
  line1: string
  line2?: string
  city: string
  country: string
  postal_code: string
}

export async function orderWelcomePack(shippingAddress: ShippingAddress) {
  return fetcher<{ checkout_url: string; order_id: string }>('/welcome-pack/order', {
    method: 'POST',
    body: JSON.stringify({ shipping_address: shippingAddress }),
  })
}

export async function getMyWelcomePackOrders() {
  return fetcher<WelcomePackOrder[]>('/welcome-pack/my')
}
