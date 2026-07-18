'use client'

// src/app/pay/[token]/_components/guardian-pay-client.tsx
//
// Guardian term-fee payment page. No login — the token in the URL is the sole
// authorization (mirrors the WhatsApp click-to-chat verification pattern used
// elsewhere in onboarding). Mirrors the admission-fee payment step in
// student/join/_components/join-client.tsx: open MarzPay's hosted page in a
// new tab, poll status every 3s until paid.

import { useEffect, useState } from 'react'
import { Loader2, Wallet, Check, AlertCircle, CalendarClock } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import {
  getGuardianPlan,
  initiateInstallmentPayment,
  getGuardianPaymentStatus,
  type GuardianPlanView,
} from '@/lib/actions/term-billing'

export function GuardianPayClient({ token }: { token: string }) {
  const [plan, setPlan] = useState<GuardianPlanView | null>(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [paymentUrl, setPaymentUrl] = useState('')
  const [paymentAmount, setPaymentAmount] = useState(0)
  const [initiating, setInitiating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      const { data, error: err } = await getGuardianPlan(token)
      if (cancelled) return
      if (err || !data) {
        setNotFound(true)
      } else {
        setPlan(data)
      }
      setLoading(false)
    })()
    return () => {
      cancelled = true
    }
  }, [token])

  async function handlePay() {
    setError(null)
    setInitiating(true)
    try {
      const { data, error: err } = await initiateInstallmentPayment(token)
      if (err || !data) {
        setError(err?.message ?? 'Could not start payment. Please try again.')
        return
      }
      if (data.status === 'paid') {
        const { data: refreshed } = await getGuardianPaymentStatus(token)
        if (refreshed) setPlan(refreshed)
        return
      }
      setPaymentUrl(data.payment_url)
      setPaymentAmount(data.amount)
      startPolling()
    } finally {
      setInitiating(false)
    }
  }

  function startPolling() {
    const id = setInterval(async () => {
      const { data } = await getGuardianPaymentStatus(token)
      if (!data) return
      setPlan(data)
      if (data.installment_due === null || data.status === 'completed') {
        clearInterval(id)
      } else if (data.installments.some((i) => i.status === 'paid')) {
        // one installment just confirmed — stop this round, let the student
        // re-request for the next one rather than silently chaining payments.
        clearInterval(id)
        setPaymentUrl('')
      }
    }, 3000)
  }

  if (loading) {
    return (
      <Card className="w-full max-w-md">
        <CardContent className="p-6 flex items-center justify-center gap-2 text-sm text-muted-foreground py-10">
          <Loader2 className="h-4 w-4 animate-spin" /> Loading…
        </CardContent>
      </Card>
    )
  }

  if (notFound || !plan) {
    return (
      <Card className="w-full max-w-md">
        <CardContent className="p-6 space-y-2 text-center">
          <AlertCircle className="h-8 w-8 text-amber-500 mx-auto" />
          <h1 className="text-lg font-bold">Link expired or invalid</h1>
          <p className="text-sm text-muted-foreground">
            This payment link is no longer valid. Please contact the school
            for a new one.
          </p>
        </CardContent>
      </Card>
    )
  }

  if (plan.status === 'locked') {
    return (
      <Card className="w-full max-w-md">
        <CardContent className="p-6 space-y-2 text-center">
          <AlertCircle className="h-8 w-8 text-rose-500 mx-auto" />
          <h1 className="text-lg font-bold">Payment overdue</h1>
          <p className="text-sm text-muted-foreground">
            {plan.student_first_name}&apos;s account has been paused. Contact{' '}
            {plan.school_name || 'the school'} to arrange payment and restore access.
          </p>
        </CardContent>
      </Card>
    )
  }

  if (plan.installment_due === null) {
    return (
      <Card className="w-full max-w-md">
        <CardContent className="p-6 space-y-2 text-center">
          <Check className="h-8 w-8 text-emerald-600 mx-auto" />
          <h1 className="text-lg font-bold">Term fee fully paid</h1>
          <p className="text-sm text-muted-foreground">
            Both installments for {plan.student_first_name} are complete. No
            further action needed this term.
          </p>
        </CardContent>
      </Card>
    )
  }

  const justPaidFirst = plan.installment_due === 2 && !paymentUrl

  return (
    <Card className="w-full max-w-md">
      <CardContent className="p-6 space-y-5 text-center">
        <div className="space-y-1">
          <h1 className="text-xl font-bold">
            Term fee — {plan.school_name || 'Mirror Intelligence'}
          </h1>
          <p className="text-sm text-muted-foreground">
            Installment {plan.installment_due} of 2 for {plan.student_first_name}.
            Pay securely via MTN or Airtel Mobile Money.
          </p>
        </div>

        {justPaidFirst && (
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800 flex items-center justify-center gap-2">
            <Check className="h-4 w-4 shrink-0" />
            Installment 1 received — {plan.student_first_name} has full access.
          </div>
        )}

        {plan.second_installment_deadline && plan.installment_due === 2 && (
          <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
            <CalendarClock className="h-3.5 w-3.5" />
            2nd installment due by{' '}
            {new Date(plan.second_installment_deadline).toLocaleDateString()}
          </div>
        )}

        {paymentUrl ? (
          <>
            <div className="rounded-xl border bg-surface-raised px-4 py-3">
              <p className="text-xs text-muted-foreground">
                Installment {plan.installment_due} of 2
              </p>
              <p className="text-2xl font-bold">
                UGX {paymentAmount.toLocaleString()}
              </p>
            </div>
            <a href={paymentUrl} target="_blank" rel="noopener noreferrer">
              <Button className="w-full font-bold">
                <Wallet className="h-4 w-4 mr-2" /> Pay with Mobile Money
              </Button>
            </a>
            <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" /> Waiting for payment confirmation…
            </div>
          </>
        ) : (
          <Button
            className="w-full font-bold"
            onClick={handlePay}
            disabled={initiating}
          >
            {initiating ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" /> Preparing payment…
              </>
            ) : (
              <>
                <Wallet className="h-4 w-4 mr-2" /> Pay installment {plan.installment_due}
              </>
            )}
          </Button>
        )}

        {error && (
          <p className="text-xs text-rose-500 font-medium flex items-center justify-center gap-1">
            <AlertCircle className="h-3.5 w-3.5 shrink-0" />
            {error}
          </p>
        )}
      </CardContent>
    </Card>
  )
}
