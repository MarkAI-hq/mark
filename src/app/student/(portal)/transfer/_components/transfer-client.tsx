'use client'

import { useState, useTransition } from 'react'
import { toast } from 'sonner'
import { ArrowRightLeft, Loader2, CheckCircle2, Clock, XCircle } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { requestTransfer, type Transfer } from '@/lib/actions/transfers'
import { format } from 'date-fns'

const STATUS_CONFIG: Record<string, { label: string; icon: typeof Clock; className: string }> = {
  pending:   { label: 'Pending',   icon: Clock,         className: 'bg-amber-100 text-amber-700' },
  completed: { label: 'Completed', icon: CheckCircle2,  className: 'bg-green-100 text-green-700' },
  cancelled: { label: 'Cancelled', icon: XCircle,       className: 'bg-red-100 text-red-700' },
}

interface Props {
  transfers: Transfer[]
}

export function TransferClient({ transfers }: Props) {
  const [schoolCode, setSchoolCode]   = useState('')
  const [isPending, startTransition]  = useTransition()

  const hasPending = transfers.some((t) => t.status === 'pending')

  function handleRequest() {
    if (!schoolCode.trim()) {
      toast.error('Enter a school code to continue.')
      return
    }
    startTransition(async () => {
      const res = await requestTransfer(schoolCode.trim().toUpperCase())
      if (res.error) {
        toast.error(res.error.message)
        return
      }
      if (res.data?.checkout_url) {
        window.location.href = res.data.checkout_url
      }
    })
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold">School Transfer</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Transfer your academic record to another school on Mark. A $10 transfer fee applies.
        </p>
      </div>

      {/* Request form */}
      {!hasPending && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <ArrowRightLeft className="h-4 w-4" />
              Request Transfer
            </CardTitle>
            <CardDescription>
              Enter the school code of the school you&apos;d like to transfer to.
              Your academic record, grades, and progress will move with you.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="schoolCode">School Code</Label>
              <div className="flex gap-2">
                <Input
                  id="schoolCode"
                  placeholder="e.g. MRK-SCH-ABC"
                  value={schoolCode}
                  onChange={(e) => setSchoolCode(e.target.value.toUpperCase())}
                  className="uppercase font-mono"
                  maxLength={20}
                />
                <Button onClick={handleRequest} disabled={isPending || !schoolCode.trim()} className="shrink-0">
                  {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Request — $10'}
                </Button>
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              You&apos;ll be redirected to complete the $10 transfer fee via Stripe.
              Your transfer is processed automatically after payment.
            </p>
          </CardContent>
        </Card>
      )}

      {hasPending && (
        <Card className="border-amber-200 bg-amber-50/50">
          <CardContent className="py-4 flex items-center gap-3">
            <Clock className="h-5 w-5 text-amber-600 shrink-0" />
            <div>
              <p className="font-medium text-amber-800">Transfer in progress</p>
              <p className="text-sm text-amber-700">
                Your transfer is pending payment. Complete checkout to continue.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Transfer history */}
      {transfers.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Transfer History</h2>
          {transfers.map((t) => {
            const cfg = STATUS_CONFIG[t.status] ?? STATUS_CONFIG.pending
            const Icon = cfg.icon
            return (
              <Card key={t.id}>
                <CardContent className="py-4 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <Icon className={`h-5 w-5 ${t.status === 'completed' ? 'text-green-600' : t.status === 'cancelled' ? 'text-red-500' : 'text-amber-600'}`} />
                    <div>
                      <p className="text-sm font-medium">Transfer Request</p>
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(t.requested_at), 'dd MMM yyyy')}
                        {t.completed_at && ` → completed ${format(new Date(t.completed_at), 'dd MMM yyyy')}`}
                      </p>
                    </div>
                  </div>
                  <Badge className={cfg.className}>{cfg.label}</Badge>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {transfers.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <ArrowRightLeft className="h-8 w-8 mx-auto text-muted-foreground/40 mb-3" />
            <p className="text-sm text-muted-foreground">No transfer history yet.</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
