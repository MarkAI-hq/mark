'use client'

// src/components/students/term-billing-status-card.tsx
//
// Self-contained: fetches its own status so it can be dropped into the
// dashboard without threading a new prop through the whole fetch chain.
// Renders nothing for free-tier students (on_plan: false).

import { useEffect, useState } from 'react'
import { AlertCircle, Check, Clock, Loader2, Send } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  getMyTermBillingStatus,
  resendGuardianLink,
  type TermBillingStatus,
} from '@/lib/actions/term-billing'

export function TermBillingStatusCard() {
  const [status, setStatus] = useState<TermBillingStatus | null>(null)
  const [resending, setResending] = useState(false)
  const [resent, setResent] = useState(false)

  useEffect(() => {
    let cancelled = false
    getMyTermBillingStatus().then(({ data }) => {
      if (!cancelled) setStatus(data)
    })
    return () => {
      cancelled = true
    }
  }, [])

  async function handleResend() {
    setResending(true)
    try {
      const { data } = await resendGuardianLink()
      setResent(!!data?.sent)
    } finally {
      setResending(false)
    }
  }

  if (!status || !status.on_plan) return null

  if (status.status === 'locked') {
    return (
      <Card className="border-rose-200 bg-rose-50">
        <CardContent className="p-4 flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-rose-600 shrink-0 mt-0.5" />
          <div className="flex-1 space-y-2">
            <p className="text-sm font-semibold text-rose-800">
              Access paused — term fee payment needed
            </p>
            <p className="text-xs text-rose-700">
              {status.billing_guardian_name
                ? `Ask ${status.billing_guardian_name} to complete payment to resume.`
                : 'Ask your guardian to complete payment to resume.'}
            </p>
            <Button
              size="sm"
              variant="outline"
              onClick={handleResend}
              disabled={resending || resent}
              className="h-7 text-xs"
            >
              {resending ? (
                <Loader2 className="h-3 w-3 mr-1.5 animate-spin" />
              ) : (
                <Send className="h-3 w-3 mr-1.5" />
              )}
              {resent ? 'Link sent' : 'Resend payment link'}
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (status.status === 'active' && status.second_installment_deadline) {
    return (
      <Card className="border-amber-200 bg-amber-50">
        <CardContent className="p-4 flex items-center gap-3">
          <Clock className="h-4 w-4 text-amber-600 shrink-0" />
          <p className="text-xs text-amber-800">
            2nd term-fee installment due by{' '}
            {new Date(status.second_installment_deadline).toLocaleDateString()}
            {status.billing_guardian_name ? ` — ${status.billing_guardian_name} has the payment link.` : '.'}
          </p>
        </CardContent>
      </Card>
    )
  }

  if (status.status === 'completed') {
    return (
      <Card className="border-emerald-200 bg-emerald-50">
        <CardContent className="p-4 flex items-center gap-3">
          <Check className="h-4 w-4 text-emerald-600 shrink-0" />
          <p className="text-xs text-emerald-800">Term fee fully paid.</p>
        </CardContent>
      </Card>
    )
  }

  return null
}
