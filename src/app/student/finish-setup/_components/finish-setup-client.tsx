'use client'

// src/app/student/finish-setup/_components/finish-setup-client.tsx
//
// Short completion flow for students a teacher/admin added directly
// (enrollment_source: 'direct') — they already have a class, subjects, and a
// vetted identity, so they skip the public self-enrol funnel entirely
// (/student/join: details, email verification, class/subject pick, demo
// lesson, admission fee). They still sign the pledge and take the diagnostic
// like every other student — those are about the student, not the channel.

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, AlertCircle, GraduationCap, ArrowRight, CheckCircle2 } from 'lucide-react'

import { toast } from '@/hooks/use-toast'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'
import { getPledgeStatus, acceptPledge } from '@/lib/actions/student-onboarding'
import {
  startDiagnostic,
  submitDiagnostic,
  type DiagnosticSubject,
  type SubmitDiagnosticResult,
} from '@/lib/actions/student-onboarding'

type Step = 'loading' | 'pledge' | 'diagnostic' | 'done'

export function FinishSetupClient({ studentName }: { studentName: string }) {
  const router = useRouter()
  const [step, setStep] = useState<Step>('loading')
  const [error, setError] = useState<string | null>(null)

  // Pledge
  const [pledgeNameTyped, setPledgeNameTyped] = useState('')
  const [pledgeSubmitting, setPledgeSubmitting] = useState(false)

  // Diagnostic
  const [diagnostics, setDiagnostics] = useState<DiagnosticSubject[]>([])
  const [answers, setAnswers] = useState<Record<string, number[]>>({})
  const [submitting, setSubmitting] = useState(false)
  const [result, setResult] = useState<SubmitDiagnosticResult | null>(null)

  // ── Entry: resume from wherever the student left off ─────────────────────
  useEffect(() => {
    (async () => {
      const { data } = await getPledgeStatus()
      if (data?.signed) {
        await loadDiagnostic()
      } else {
        setStep('pledge')
      }
    })()
     
  }, [])

  async function handleSignPledge() {
    setError(null)
    if (!pledgeNameTyped.trim()) {
      setError('Type your full name to sign the code.')
      return
    }
    setPledgeSubmitting(true)
    try {
      const { error: err } = await acceptPledge(pledgeNameTyped.trim())
      if (err) {
        setError(err.message ?? 'Could not sign the pledge. Please try again.')
        return
      }
      await loadDiagnostic()
    } finally {
      setPledgeSubmitting(false)
    }
  }

  async function loadDiagnostic() {
    setError(null)
    const { data: diag } = await startDiagnostic()
    const subs = diag?.diagnostics ?? []
    if (subs.length === 0) {
      setStep('done')
      return
    }
    setDiagnostics(subs)
    setAnswers(
      Object.fromEntries(
        subs.map((s) => [s.assessment_id, s.questions.map(() => -1)]),
      ),
    )
    setStep('diagnostic')
  }

  function selectOption(assessmentId: string, qIndex: number, optIndex: number) {
    setAnswers((prev) => {
      const next = { ...prev }
      const arr = [...(next[assessmentId] ?? [])]
      arr[qIndex] = optIndex
      next[assessmentId] = arr
      return next
    })
  }

  const totalQuestions = diagnostics.reduce((n, d) => n + d.questions.length, 0)
  const answeredCount = Object.values(answers)
    .flat()
    .filter((a) => a >= 0).length
  const allAnswered = totalQuestions > 0 && answeredCount === totalQuestions

  async function handleSubmitDiagnostic() {
    setError(null)
    setSubmitting(true)
    try {
      const { data, error: err } = await submitDiagnostic({
        results: diagnostics.map((d) => ({
          assessment_id: d.assessment_id,
          answers: (answers[d.assessment_id] ?? []).map((a) => (a < 0 ? -1 : a)),
        })),
      })
      if (err || !data) {
        setError(err?.message ?? 'Could not submit results. Please try again.')
        return
      }
      setResult(data)
      setStep('done')
    } finally {
      setSubmitting(false)
    }
  }

  function goToDashboard() {
    toast({ title: 'Welcome!', description: 'Your account is ready.' })
    router.push('/student/dashboard')
    router.refresh()
  }

  return (
    <div className="w-full max-w-lg">

      {step === 'loading' && (
        <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground py-16">
          <Loader2 className="h-4 w-4 animate-spin" /> Loading…
        </div>
      )}

      {step === 'pledge' && (
        <Card>
          <CardContent className="p-6 space-y-5">
            <div className="space-y-1">
              <h1 className="text-xl font-bold">Welcome, {studentName.split(' ')[0]}.</h1>
              <p className="text-sm text-muted-foreground">
                Your teacher has already set up your class. One last step —
                read and sign the code every Mirror Campus student agrees to.
              </p>
            </div>

            <div className="rounded-xl border bg-surface-raised px-4 py-4 text-sm space-y-2">
              <p>I&apos;m joining Mirror Campus to grow — not just to pass. I agree to:</p>
              <ul className="list-disc pl-5 space-y-1 text-muted-foreground">
                <li>Show up and do my own work — my answers, my thinking, my effort.</li>
                <li>Use Tracy and every tool here to learn, not to shortcut learning.</li>
                <li>Treat my classmates, teachers, and the platform with honesty and respect.</li>
                <li>Keep trying after a wrong answer — that&apos;s where the real learning happens.</li>
              </ul>
            </div>

            <div className="space-y-1.5 text-left">
              <Label>Type your full name to sign</Label>
              <Input
                placeholder={studentName || 'Your full name'}
                value={pledgeNameTyped}
                onChange={(e) => setPledgeNameTyped(e.target.value)}
              />
            </div>

            <Button
              className="w-full font-bold"
              onClick={handleSignPledge}
              disabled={pledgeSubmitting}
            >
              {pledgeSubmitting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
              Sign and continue
            </Button>

            {error && (
              <p className="text-xs text-rose-500 font-medium flex items-center gap-1">
                <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                {error}
              </p>
            )}
          </CardContent>
        </Card>
      )}

      {step === 'diagnostic' && (
        <Card>
          <CardContent className="p-6 space-y-6">
            <div className="space-y-1">
              <h1 className="text-xl font-bold">Quick check — what do you know?</h1>
              <p className="text-sm text-muted-foreground">
                A few questions per subject. There&apos;s no pass or fail — this just
                sets your starting point.
              </p>
              <p className="text-xs text-muted-foreground">
                {answeredCount} / {totalQuestions} answered
              </p>
            </div>

            {diagnostics.map((d) => (
              <div key={d.assessment_id} className="space-y-4">
                <div className="flex items-center gap-2">
                  <GraduationCap className="h-4 w-4 text-gold" />
                  <h2 className="font-semibold">{d.subject}</h2>
                </div>
                {d.questions.map((q, qi) => (
                  <div key={qi} className="space-y-2">
                    <p className="text-sm font-medium">
                      {qi + 1}. {q.question}
                    </p>
                    <div className="grid gap-2">
                      {q.options.map((opt, oi) => {
                        const selected = (answers[d.assessment_id] ?? [])[qi] === oi
                        return (
                          <button
                            key={oi}
                            type="button"
                            onClick={() => selectOption(d.assessment_id, qi, oi)}
                            className={`text-left text-sm rounded-lg border px-3 py-2 transition ${
                              selected
                                ? 'border-gold bg-gold/10 font-medium'
                                : 'border-slate-200 hover:bg-surface-raised'
                            }`}
                          >
                            {opt}
                          </button>
                        )
                      })}
                    </div>
                  </div>
                ))}
              </div>
            ))}

            {error && (
              <p className="text-xs text-rose-500 font-medium flex items-center gap-1">
                <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                {error}
              </p>
            )}

            <Button
              onClick={handleSubmitDiagnostic}
              disabled={submitting || !allAnswered}
              className="w-full font-bold"
            >
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" /> Scoring…
                </>
              ) : allAnswered ? (
                'See where I stand'
              ) : (
                `Answer all questions (${answeredCount}/${totalQuestions})`
              )}
            </Button>
          </CardContent>
        </Card>
      )}

      {step === 'done' && (
        <Card>
          <CardContent className="p-6 space-y-5 text-center">
            <CheckCircle2 className="h-14 w-14 text-emerald-500 mx-auto" />
            <div className="space-y-1">
              <h1 className="text-xl font-bold">You&apos;re all set, {studentName.split(' ')[0]}.</h1>
              <p className="text-sm text-muted-foreground">
                {result
                  ? `Starting point: ${result.baseline_pct}% baseline across your subjects.`
                  : 'Your dashboard is ready.'}
              </p>
            </div>
            <Button className="w-full font-bold" onClick={goToDashboard}>
              Go to my dashboard <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </CardContent>
        </Card>
      )}

    </div>
  )
}
