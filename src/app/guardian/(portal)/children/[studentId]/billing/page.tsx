import { ExternalLink } from 'lucide-react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { getChildBillingStatus } from '@/lib/actions/guardian'

export default async function GuardianChildBillingPage({
  params,
}: {
  params: Promise<{ studentId: string }>
}) {
  const { studentId } = await params
  const { data: billing, error } = await getChildBillingStatus(studentId)

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Term billing</h1>

      {error && (
        <p className="text-sm text-destructive">
          Couldn&apos;t load billing status right now.
        </p>
      )}

      {!error && billing && !billing.on_plan && (
        <Card>
          <CardContent className="py-8 text-center text-sm text-muted-foreground">
            This student isn&apos;t on a term-billing plan.
          </CardContent>
        </Card>
      )}

      {!error && billing?.on_plan && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center justify-between">
              Plan status
              <Badge variant={billing.status === 'active' ? 'default' : 'secondary'}>
                {billing.status}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {billing.second_installment_deadline && (
              <p className="text-sm text-muted-foreground">
                Second installment due{' '}
                {new Date(billing.second_installment_deadline).toLocaleDateString()}
              </p>
            )}
            {billing.billing_guardian_name && (
              <p className="text-sm text-muted-foreground">
                Billing contact: {billing.billing_guardian_name}
              </p>
            )}
            <Button asChild>
              <a href={billing.payment_url} target="_blank" rel="noopener noreferrer">
                Pay now
                <ExternalLink className="ml-2 h-4 w-4" />
              </a>
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
