import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getTermBillingDetailAdmin } from '@/lib/actions/term-billing'
import { TermBillingDetailClient } from './_components/term-billing-detail-client'

export const metadata: Metadata = { title: 'Term Billing — Plan Detail' }

export default async function TermBillingDetailPage({
  params,
}: {
  params: Promise<{ planId: string }>
}) {
  const { planId } = await params
  const { data, error } = await getTermBillingDetailAdmin(planId)
  if (error || !data) notFound()

  return <TermBillingDetailClient plan={data.plan} payments={data.payments} />
}
