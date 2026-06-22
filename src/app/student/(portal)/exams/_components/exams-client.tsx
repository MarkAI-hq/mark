'use client'

import { useState, useTransition } from 'react'
import { toast } from 'sonner'
import { FileCheck, Loader2, CheckCircle2, Clock, AlertCircle, Trophy } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { registerForExam, type ExamRegistration } from '@/lib/actions/exam-registrations'

const EXAM_BODIES = ['UNEB', 'Cambridge IGCSE', 'Cambridge A-Level', 'WAEC', 'NECO', 'IB', 'Edexcel', 'AQA', 'Other']
const EXAM_SESSIONS = ['May/June 2025', 'October/November 2025', 'January 2026', 'May/June 2026', 'October/November 2026']

const STATUS_CONFIG: Record<string, { label: string; className: string }> = {
  pending:    { label: 'Pending Payment', className: 'bg-amber-100 text-amber-700' },
  paid:       { label: 'Paid',            className: 'bg-blue-100 text-blue-700' },
  registered: { label: 'Registered',      className: 'bg-green-100 text-green-700' },
  cancelled:  { label: 'Cancelled',       className: 'bg-red-100 text-red-700' },
}

interface Props {
  registrations: ExamRegistration[]
}

export function ExamsClient({ registrations }: Props) {
  const [isPending, startTransition] = useTransition()
  const [examBody, setExamBody]      = useState('')
  const [examType, setExamType]      = useState('')
  const [session, setSession]        = useState('')
  const [feeStr, setFeeStr]          = useState('')
  const [showForm, setShowForm]      = useState(false)

  function handleRegister() {
    const fee = parseFloat(feeStr)
    if (!examBody || !examType || isNaN(fee) || fee <= 0) {
      toast.error('Please fill in all required fields.')
      return
    }
    startTransition(async () => {
      const res = await registerForExam({
        exam_body: examBody,
        exam_type: examType,
        exam_session: session || undefined,
        fee_usd: fee,
      })
      if (res.error) {
        toast.error(res.error.message)
        return
      }
      if (res.data?.checkout_url) {
        window.location.href = res.data.checkout_url
      }
    })
  }

  const passed = registrations.filter((r) => r.result_status === 'passed')

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold">Exam Registrations</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Register for external examinations through your school.
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={() => setShowForm(!showForm)}>
          {showForm ? 'Cancel' : 'New Registration'}
        </Button>
      </div>

      {/* Goal achieved — the "you did it" moment when real results come in */}
      {passed.length > 0 && (
        <div className="rounded-2xl border border-emerald-300 bg-emerald-50 dark:bg-emerald-900/20 p-5 text-center">
          <Trophy className="h-8 w-8 text-emerald-600 mx-auto mb-2" />
          <h2 className="text-lg font-bold text-emerald-900 dark:text-emerald-100">
            You did it! 🎉
          </h2>
          {passed.map((r) => (
            <p key={r.id} className="text-sm text-emerald-700 dark:text-emerald-300 mt-1">
              {r.exam_body} {r.exam_type}: <span className="font-semibold">{r.result_grade}</span> — passed
            </p>
          ))}
          <p className="text-xs text-emerald-700/80 dark:text-emerald-300/80 mt-2">
            This is the goal you set out to reach. Incredibly well done.
          </p>
        </div>
      )}

      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Register for an Exam</CardTitle>
            <CardDescription>
              Your school will submit the registration to the exam board after payment.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Exam Body *</Label>
                <Select value={examBody} onValueChange={setExamBody}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select exam body" />
                  </SelectTrigger>
                  <SelectContent>
                    {EXAM_BODIES.map((b) => (
                      <SelectItem key={b} value={b}>{b}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="examType">Subject / Exam Type *</Label>
                <Input
                  id="examType"
                  placeholder="e.g. Mathematics, Biology"
                  value={examType}
                  onChange={(e) => setExamType(e.target.value)}
                />
              </div>
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Session</Label>
                <Select value={session} onValueChange={setSession}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select session" />
                  </SelectTrigger>
                  <SelectContent>
                    {EXAM_SESSIONS.map((s) => (
                      <SelectItem key={s} value={s}>{s}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="fee">Registration Fee (USD) *</Label>
                <Input
                  id="fee"
                  type="number"
                  min="1"
                  step="0.01"
                  placeholder="e.g. 45.00"
                  value={feeStr}
                  onChange={(e) => setFeeStr(e.target.value)}
                />
              </div>
            </div>
            <div className="flex items-center gap-2 p-3 bg-amber-50 rounded-lg">
              <AlertCircle className="h-4 w-4 text-amber-600 shrink-0" />
              <p className="text-xs text-amber-700">
                A 10% Mark service fee is added to the exam board fee. Your school will confirm registration with the exam body.
              </p>
            </div>
            <Button onClick={handleRegister} disabled={isPending} className="w-full gap-2">
              {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileCheck className="h-4 w-4" />}
              Proceed to Payment
            </Button>
          </CardContent>
        </Card>
      )}

      {registrations.length === 0 && !showForm ? (
        <Card>
          <CardContent className="py-16 text-center">
            <FileCheck className="h-10 w-10 mx-auto text-muted-foreground/40 mb-3" />
            <p className="font-medium text-muted-foreground">No exam registrations yet</p>
            <p className="text-sm text-muted-foreground/70 mt-1">
              Register for an external exam and your school will handle the submission.
            </p>
            <Button className="mt-4" size="sm" onClick={() => setShowForm(true)}>
              Register Now
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {registrations.map((reg) => {
            const cfg = STATUS_CONFIG[reg.status] ?? STATUS_CONFIG.pending
            return (
              <Card key={reg.id}>
                <CardContent className="py-4">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="font-medium">{reg.exam_body} — {reg.exam_type}</p>
                      <div className="flex items-center gap-2 mt-1">
                        {reg.exam_session && (
                          <span className="text-xs text-muted-foreground">{reg.exam_session}</span>
                        )}
                        {reg.registration_number && (
                          <span className="text-xs font-mono text-muted-foreground">
                            Ref: {reg.registration_number}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-sm font-semibold">${Number(reg.fee_usd).toFixed(2)}</span>
                      <Badge className={cfg.className}>{cfg.label}</Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
