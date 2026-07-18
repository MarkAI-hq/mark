'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Loader2, Unlock, Lock, CheckCircle2, Ban, RotateCcw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  overrideTermBillingPlan,
  refundTermInstallment,
  type AdminTermBillingPlan,
  type AdminTermInstallmentPayment,
} from '@/lib/actions/term-billing'

const STATUS_LABEL: Record<string, string> = {
  awaiting_first: 'Awaiting 1st payment',
  active: 'Active',
  locked: 'Locked',
  completed: 'Completed',
  cancelled: 'Cancelled',
  refunded: 'Refunded',
}

export function TermBillingDetailClient({
  plan,
  payments,
}: {
  plan: AdminTermBillingPlan
  payments: AdminTermInstallmentPayment[]
}) {
  const router = useRouter()
  const [busy, setBusy] = useState<string | null>(null)

  async function handleOverride(status: 'active' | 'completed' | 'locked' | 'cancelled') {
    const note = window.prompt(
      `Note for this override to "${STATUS_LABEL[status]}" (optional, for the audit trail):`,
    )
    if (note === null) return // cancelled the prompt
    setBusy(status)
    try {
      const { error } = await overrideTermBillingPlan(plan.id, status, note || undefined)
      if (error) {
        toast.error(error.message ?? 'Override failed')
        return
      }
      toast.success(`Plan set to "${STATUS_LABEL[status]}"`)
      router.refresh()
    } finally {
      setBusy(null)
    }
  }

  async function handleRefund(paymentId: string) {
    const reason = window.prompt('Refund reason (for the audit trail):')
    if (reason === null) return
    if (!window.confirm('Mark this installment refunded? The mobile-money payout must still be completed manually — this only updates records.')) return
    setBusy(paymentId)
    try {
      const { error } = await refundTermInstallment(paymentId, reason || undefined)
      if (error) {
        toast.error(error.message ?? 'Refund failed')
        return
      }
      toast.success('Marked refunded — complete the mobile-money payout manually')
      router.refresh()
    } finally {
      setBusy(null)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Term Billing — Plan Detail</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {plan.term_label || 'Current term'} · UGX {plan.amount_ugx.toLocaleString()}
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            Status: <Badge variant="secondary">{STATUS_LABEL[plan.status] ?? plan.status}</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {plan.second_installment_deadline && (
            <p className="text-sm text-muted-foreground">
              2nd installment deadline:{' '}
              {new Date(plan.second_installment_deadline).toLocaleDateString()}
            </p>
          )}

          <div className="flex flex-wrap gap-2 pt-2">
            <Button
              size="sm"
              variant="outline"
              disabled={busy !== null || plan.status === 'active'}
              onClick={() => handleOverride('active')}
            >
              {busy === 'active' ? (
                <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
              ) : (
                <Unlock className="h-3.5 w-3.5 mr-1.5" />
              )}
              Unlock / set active
            </Button>
            <Button
              size="sm"
              variant="outline"
              disabled={busy !== null || plan.status === 'completed'}
              onClick={() => handleOverride('completed')}
            >
              {busy === 'completed' ? (
                <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
              ) : (
                <CheckCircle2 className="h-3.5 w-3.5 mr-1.5" />
              )}
              Mark fully paid
            </Button>
            <Button
              size="sm"
              variant="outline"
              disabled={busy !== null || plan.status === 'locked'}
              onClick={() => handleOverride('locked')}
            >
              {busy === 'locked' ? (
                <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
              ) : (
                <Lock className="h-3.5 w-3.5 mr-1.5" />
              )}
              Lock
            </Button>
            <Button
              size="sm"
              variant="ghost"
              className="text-destructive hover:text-destructive"
              disabled={busy !== null || plan.status === 'cancelled'}
              onClick={() => handleOverride('cancelled')}
            >
              {busy === 'cancelled' ? (
                <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
              ) : (
                <Ban className="h-3.5 w-3.5 mr-1.5" />
              )}
              Cancel plan
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Payment history</CardTitle>
        </CardHeader>
        <CardContent>
          {payments.length === 0 ? (
            <p className="text-sm text-muted-foreground">No payment attempts yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border/40 text-left text-xs uppercase tracking-wide text-muted-foreground">
                    <th className="px-3 py-2 font-medium">Installment</th>
                    <th className="px-3 py-2 font-medium">Amount</th>
                    <th className="px-3 py-2 font-medium">Status</th>
                    <th className="px-3 py-2 font-medium">Paid</th>
                    <th className="px-3 py-2 font-medium" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/30">
                  {payments.map((p) => (
                    <tr key={p.id}>
                      <td className="px-3 py-2">{p.installment_number} of 2</td>
                      <td className="px-3 py-2 text-muted-foreground">
                        UGX {p.amount.toLocaleString()}
                      </td>
                      <td className="px-3 py-2">
                        <Badge variant="secondary" className="text-xs">{p.status}</Badge>
                      </td>
                      <td className="px-3 py-2 text-muted-foreground">
                        {p.paid_at ? new Date(p.paid_at).toLocaleDateString() : '—'}
                      </td>
                      <td className="px-3 py-2 text-right">
                        {p.status === 'paid' && (
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-7 text-xs text-destructive hover:text-destructive"
                            disabled={busy !== null}
                            onClick={() => handleRefund(p.id)}
                          >
                            {busy === p.id ? (
                              <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                            ) : (
                              <RotateCcw className="h-3 w-3 mr-1" />
                            )}
                            Refund
                          </Button>
                        )}
                        {p.refunded_at && (
                          <span className="text-xs text-muted-foreground">
                            Refunded {new Date(p.refunded_at).toLocaleDateString()}
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
