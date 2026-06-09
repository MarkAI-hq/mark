import { Metadata }  from 'next'
import { redirect }  from 'next/navigation'
import { getSession }        from '@/lib/session'
import { getSubscription, getGradingQuota } from '@/lib/actions/subscriptions'
import { BillingClient }     from './_components/billing-client'

export const metadata: Metadata = {
  title:       'Billing — Mirror Intelligence',
  description: 'Manage your subscription',
}

export default async function BillingPage() {
  const user = await getSession()
  if (!user || !user.organizationId) redirect('/login')
  if (user.role !== 'Admin')         redirect('/dashboard')

  const [{ data: subscription, error }, { data: gradingQuota }] = await Promise.all([
    getSubscription(),
    getGradingQuota(),
  ])

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h3 className="text-xl font-semibold tracking-tight">Billing &amp; Subscription</h3>
        <p className="text-sm text-muted-foreground">
          Manage your plan, usage limits, and payment details.
        </p>
      </div>
      <BillingClient
        subscription={subscription}
        gradingQuota={gradingQuota}
        error={error?.message}
      />
    </div>
  )
}
