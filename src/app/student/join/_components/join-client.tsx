'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Sparkles,
  GraduationCap,
  CheckCircle2,
  Loader2,
  KeyRound,
  MessageCircle,
  BookOpen,
  Lock,
  Clock,
  Hourglass,
  School,
} from 'lucide-react'

import { toast } from '@/hooks/use-toast'
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
import { Card, CardContent } from '@/components/ui/card'
import { selfEnroll, checkEnrolStatus } from '@/lib/actions/enrollment'
import { verifyEnrolOtp, completeWhatsappEnrol } from '@/lib/actions/student-auth'
import { updateStudentPaceSettings } from '@/lib/actions/study-plans'
import {
  startDiagnostic,
  submitDiagnostic,
  getSelfEnrollClasses,
  getSelfEnrollSubjects,
  generateDemoLesson,
  submitEnrollmentRequest,
  type DiagnosticSubject,
  type SubmitDiagnosticResult,
  type SelfEnrollClass,
  type SelfEnrollSubjects,
  type DemoLesson,
} from '@/lib/actions/student-onboarding'

type Step =
  | 'details'
  | 'verify'
  | 'class'
  | 'subjects'
  | 'demo'
  | 'timetable'
  | 'diagnostic'
  | 'results'

const LEVELS = ['S1', 'S2', 'S3', 'S4', 'S5', 'S6']
const DAYS = [
  { i: 1, label: 'Mon' }, { i: 2, label: 'Tue' }, { i: 3, label: 'Wed' },
  { i: 4, label: 'Thu' }, { i: 5, label: 'Fri' }, { i: 6, label: 'Sat' },
  { i: 0, label: 'Sun' },
]

interface Credentials {
  school_code: string
  student_school_id: string
  pin: string
}

export function JoinClient({ schoolCode }: { schoolCode: string }) {
  const router = useRouter()
  const [step, setStep] = useState<Step>('details')

  // ── Step 1: details ────────────────────────────────────────────────────────
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [level, setLevel] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [enrolling, setEnrolling] = useState(false)

  // ── Step 2: verify (email OTP, or WhatsApp click-to-chat) ────────────────────
  const [pending, setPending] = useState<{
    student_id: string
    channel: 'email' | 'whatsapp'
    school_code: string
    student_school_id: string
    contact?: string
    verify_id?: string
    wa_link?: string
  } | null>(null)
  const [code, setCode] = useState('')
  const [verifying, setVerifying] = useState(false)
  const [waState, setWaState] = useState<'waiting' | 'finishing'>('waiting')

  // ── Step 3: class selection (WS4) ───────────────────────────────────────────
  const [classes, setClasses] = useState<SelfEnrollClass[]>([])
  const [classesLoading, setClassesLoading] = useState(false)
  const [selectedClassId, setSelectedClassId] = useState('')
  const [joinNotice, setJoinNotice] = useState('')

  // ── Step 4: subjects (WS3) ──────────────────────────────────────────────────
  const [subjects, setSubjects] = useState<SelfEnrollSubjects | null>(null)
  const [subjectsLoading, setSubjectsLoading] = useState(false)
  const [electives, setElectives] = useState<string[]>([])
  const [savingSubjects, setSavingSubjects] = useState(false)

  // ── Step 5: demo lesson (WS6) ───────────────────────────────────────────────
  const [demo, setDemo] = useState<DemoLesson | null>(null)
  const [demoLoading, setDemoLoading] = useState(false)

  // ── Step 6: weekly-target timetable (WS5) ───────────────────────────────────
  const [studyMode, setStudyMode] = useState<'open' | 'guided'>('open')
  const [studyDays, setStudyDays] = useState<number[]>([1, 2, 3, 4, 5])
  const [studyTime, setStudyTime] = useState('18:00')
  const [weeklyHours, setWeeklyHours] = useState(10)
  const [savingPace, setSavingPace] = useState(false)

  // ── Carried across steps ────────────────────────────────────────────────────
  const [creds, setCreds] = useState<Credentials | null>(null)
  const [diagnostics, setDiagnostics] = useState<DiagnosticSubject[]>([])
  const [answers, setAnswers] = useState<Record<string, number[]>>({})
  const [submitting, setSubmitting] = useState(false)
  const [result, setResult] = useState<SubmitDiagnosticResult | null>(null)

  const selectedClassName =
    classes.find((c) => c.class_id === selectedClassId)?.name ?? null

  async function handleEnroll() {
    if (!firstName.trim() || !lastName.trim()) {
      toast({ title: 'Please enter your name', variant: 'destructive' })
      return
    }
    if (!email.trim()) {
      toast({
        title: 'Email required',
        description: 'Enter your email so we can verify it’s you.',
        variant: 'destructive',
      })
      return
    }
    setEnrolling(true)
    try {
      const { data: enrolled, error } = await selfEnroll({
        school_code: schoolCode,
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        education_level: level || undefined,
        email: email.trim() || undefined,
        phone_number: phone.trim() || undefined,
      })
      if (error || !enrolled) {
        toast({
          title: 'Could not enroll',
          description: error?.message ?? 'Please try again.',
          variant: 'destructive',
        })
        return
      }
      setPending({
        student_id: enrolled.student_id,
        channel: enrolled.channel,
        school_code: enrolled.school_code,
        student_school_id: enrolled.student_school_id,
        contact: enrolled.contact,
        verify_id: enrolled.verify_id,
        wa_link: enrolled.wa_link,
      })
      setWaState('waiting')
      setStep('verify')
    } finally {
      setEnrolling(false)
    }
  }

  // WhatsApp: poll for the inbound message, then complete the sign-up.
  function startWhatsappPolling() {
    if (!pending?.verify_id) return
    const id = setInterval(async () => {
      const { data } = await checkEnrolStatus(pending.verify_id!)
      if (data?.status === 'verified') {
        clearInterval(id)
        setWaState('finishing')
        await completeWhatsappVerification()
      }
    }, 3000)
  }

  async function completeWhatsappVerification() {
    if (!pending?.verify_id) return
    const { data: session, error } = await completeWhatsappEnrol(pending.verify_id)
    if (error || !session) {
      setWaState('waiting')
      toast({
        title: 'Could not finish sign-up',
        description: error ?? 'Please try again.',
        variant: 'destructive',
      })
      return
    }
    setCreds({
      school_code: pending.school_code,
      student_school_id: pending.student_school_id,
      pin: session.pin,
    })
    goToClassStep()
  }

  async function handleVerify() {
    if (!pending || code.trim().length < 4) {
      toast({ title: 'Enter the code we sent you', variant: 'destructive' })
      return
    }
    setVerifying(true)
    try {
      const { data: session, error } = await verifyEnrolOtp({
        student_id: pending.student_id,
        code: code.trim(),
      })
      if (error || !session) {
        toast({
          title: 'Verification failed',
          description: error ?? 'Check the code and try again.',
          variant: 'destructive',
        })
        return
      }
      setCreds({
        school_code: pending.school_code,
        student_school_id: pending.student_school_id,
        pin: session.pin,
      })
      goToClassStep()
    } finally {
      setVerifying(false)
    }
  }

  // ── Class step ──────────────────────────────────────────────────────────────
  async function goToClassStep() {
    setStep('class')
    setClassesLoading(true)
    try {
      const { data } = await getSelfEnrollClasses(schoolCode, level || undefined)
      setClasses(data?.classes ?? [])
    } finally {
      setClassesLoading(false)
    }
  }

  async function handleChooseClass() {
    if (!selectedClassId) {
      toast({ title: 'Pick a class to request to join', variant: 'destructive' })
      return
    }
    setStep('subjects')
    setSubjectsLoading(true)
    try {
      const { data } = await getSelfEnrollSubjects(schoolCode, level || undefined)
      setSubjects(data ?? null)
      setJoinNotice(data?.joinNotice ?? '')
    } finally {
      setSubjectsLoading(false)
    }
  }

  // ── Subjects step ─────────────────────────────────────────────────────────
  function toggleElective(key: string) {
    const max = subjects?.electiveMax ?? 1
    setElectives((prev) => {
      if (prev.includes(key)) return prev.filter((k) => k !== key)
      if (prev.length >= max) {
        // Replace the oldest pick when at the cap of a single-choice band.
        if (max === 1) return [key]
        toast({ title: `Choose up to ${max} electives`, variant: 'destructive' })
        return prev
      }
      return [...prev, key]
    })
  }

  async function handleChooseSubjects() {
    const min = subjects?.electiveMin ?? 0
    const max = subjects?.electiveMax ?? 0
    if (electives.length < min || electives.length > max) {
      const range = min === max ? `${min}` : `${min}–${max}`
      toast({
        title: `Choose ${range} elective${max === 1 ? '' : 's'}`,
        variant: 'destructive',
      })
      return
    }
    setSavingSubjects(true)
    try {
      const { error } = await submitEnrollmentRequest({
        requested_class_id: selectedClassId,
        elective_subjects: electives,
      })
      if (error) {
        toast({
          title: 'Could not save your choices',
          description: error.message ?? 'Please try again.',
          variant: 'destructive',
        })
        return
      }
      goToDemoStep()
    } finally {
      setSavingSubjects(false)
    }
  }

  // ── Demo step ─────────────────────────────────────────────────────────────
  async function goToDemoStep() {
    setStep('demo')
    setDemoLoading(true)
    try {
      const demoSubject =
        subjects?.compulsory[0]?.label ?? subjects?.electives[0]?.label
      const { data } = await generateDemoLesson(
        schoolCode,
        level || undefined,
        demoSubject,
      )
      setDemo(data ?? null)
    } finally {
      setDemoLoading(false)
    }
  }

  // ── Timetable step ──────────────────────────────────────────────────────────
  function toggleDay(i: number) {
    setStudyDays((prev) =>
      prev.includes(i) ? prev.filter((d) => d !== i) : [...prev, i],
    )
  }

  const perDayMinutes =
    studyDays.length > 0 ? Math.round((weeklyHours * 60) / studyDays.length) : 0
  const perDayLabel =
    perDayMinutes >= 60
      ? `${(perDayMinutes / 60).toFixed(perDayMinutes % 60 === 0 ? 0 : 1)}h`
      : `${perDayMinutes}m`

  async function handleChooseTimetable() {
    if (!pending) return
    if (studyDays.length === 0) {
      toast({ title: 'Pick at least one study day', variant: 'destructive' })
      return
    }
    setSavingPace(true)
    try {
      await updateStudentPaceSettings(pending.student_id, {
        lessons_per_day: 1,
        preferred_reminder_time: studyMode === 'guided' ? studyTime : '18:00',
        reminder_enabled: true,
        study_mode: studyMode,
        study_days: studyDays,
        weekly_target_hours: weeklyHours,
      })
      await loadDiagnostic()
    } finally {
      setSavingPace(false)
    }
  }

  // ── Diagnostic step ───────────────────────────────────────────────────────
  async function loadDiagnostic() {
    const { data: diag } = await startDiagnostic()
    const subs = diag?.diagnostics ?? []
    if (subs.length === 0) {
      // No diagnostic — go straight to the pending-approval result.
      setResult({ baseline_pct: 0, subjects: [], plan_status: 'pending' })
      setStep('results')
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
    setSubmitting(true)
    try {
      const { data, error } = await submitDiagnostic({
        results: diagnostics.map((d) => ({
          assessment_id: d.assessment_id,
          answers: (answers[d.assessment_id] ?? []).map((a) => (a < 0 ? -1 : a)),
        })),
      })
      if (error || !data) {
        toast({
          title: 'Could not submit',
          description: error?.message ?? 'Please try again.',
          variant: 'destructive',
        })
        return
      }
      setResult(data)
      setStep('results')
    } finally {
      setSubmitting(false)
    }
  }

  // ── Render ───────────────────────────────────────────────────────────────────
  return (
    <div className="w-full max-w-2xl">
      <div className="flex items-center gap-2 mb-6 justify-center">
        <Sparkles className="h-5 w-5 text-gold" />
        <span className="font-semibold tracking-tight">Mirror Intelligence</span>
      </div>

      {step === 'details' && (
        <Card>
          <CardContent className="p-6 space-y-5">
            <div className="space-y-1">
              <h1 className="text-xl font-bold">Start learning today</h1>
              <p className="text-sm text-muted-foreground">
                Create your free student account. We&apos;ll check what you already
                know and build a plan around the gaps.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>First name</Label>
                <Input value={firstName} onChange={(e) => setFirstName(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label>Last name</Label>
                <Input value={lastName} onChange={(e) => setLastName(e.target.value)} />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label>Your level</Label>
              <Select value={level} onValueChange={setLevel}>
                <SelectTrigger>
                  <SelectValue placeholder="Select your class level" />
                </SelectTrigger>
                <SelectContent>
                  {LEVELS.map((l) => (
                    <SelectItem key={l} value={l}>
                      {l}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label>Email</Label>
              <Input
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div className="space-y-1.5">
              <Label>WhatsApp number <span className="text-muted-foreground">(optional)</span></Label>
              <Input
                type="tel"
                placeholder="+256…"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </div>
            <p className="text-xs text-muted-foreground -mt-2">
              We&apos;ll email you a code to confirm it&apos;s you. Mirror is live in
              Uganda and expanding to more countries soon.
            </p>

            <Button onClick={handleEnroll} disabled={enrolling} className="w-full font-bold">
              {enrolling ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" /> Setting up…
                </>
              ) : (
                'Create my account'
              )}
            </Button>
            <p className="text-center text-xs text-muted-foreground">
              Joining <span className="font-medium">{schoolCode}</span>. Already have
              an account?{' '}
              <a href="/student/login" className="underline">
                Sign in
              </a>
            </p>
          </CardContent>
        </Card>
      )}

      {step === 'verify' && pending && pending.channel === 'whatsapp' && (
        <Card>
          <CardContent className="p-6 space-y-5 text-center">
            <div className="space-y-1">
              <h1 className="text-xl font-bold">Verify on WhatsApp</h1>
              <p className="text-sm text-muted-foreground">
                Tap below to open WhatsApp and send us the pre-filled message. That
                confirms your number — then we&apos;ll send your login details right
                here in the chat.
              </p>
            </div>

            {waState === 'waiting' ? (
              <>
                <a
                  href={pending.wa_link}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={startWhatsappPolling}
                >
                  <Button className="w-full font-bold bg-[#25D366] hover:bg-[#1da851] text-white">
                    <MessageCircle className="h-4 w-4 mr-2" /> Open WhatsApp to verify
                  </Button>
                </a>
                <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" /> Waiting for your message…
                </div>
              </>
            ) : (
              <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground py-2">
                <Loader2 className="h-4 w-4 animate-spin" /> Got it — finishing your sign-up…
              </div>
            )}

            <button
              type="button"
              onClick={() => setStep('details')}
              className="w-full text-center text-xs text-muted-foreground underline"
            >
              Use a different number? Go back
            </button>
          </CardContent>
        </Card>
      )}

      {step === 'verify' && pending && pending.channel === 'email' && (
        <Card>
          <CardContent className="p-6 space-y-5">
            <div className="space-y-1">
              <h1 className="text-xl font-bold">Confirm it&apos;s you</h1>
              <p className="text-sm text-muted-foreground">
                We sent a 6-digit code to{' '}
                <span className="font-medium">{pending.contact}</span>. Enter it below.
              </p>
            </div>

            <div className="space-y-1.5">
              <Label>Verification code</Label>
              <Input
                inputMode="numeric"
                autoFocus
                maxLength={6}
                placeholder="123456"
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
                className="text-center text-2xl tracking-[0.5em] font-mono"
              />
            </div>

            <Button
              onClick={handleVerify}
              disabled={verifying || code.trim().length < 4}
              className="w-full font-bold"
            >
              {verifying ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" /> Verifying…
                </>
              ) : (
                'Verify & continue'
              )}
            </Button>
            <button
              type="button"
              onClick={() => setStep('details')}
              className="w-full text-center text-xs text-muted-foreground underline"
            >
              Wrong contact? Go back
            </button>
          </CardContent>
        </Card>
      )}

      {step === 'class' && (
        <Card>
          <CardContent className="p-6 space-y-5">
            <div className="space-y-1">
              <h1 className="text-xl font-bold">Choose your class</h1>
              <p className="text-sm text-muted-foreground">
                Pick the class you&apos;d like to join. An admin reviews and approves
                every request.
              </p>
            </div>

            {classesLoading ? (
              <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground py-6">
                <Loader2 className="h-4 w-4 animate-spin" /> Loading classes…
              </div>
            ) : classes.length === 0 ? (
              <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                No classes are open for self-enrollment here yet. You can continue —
                an admin will place you in the right class on approval.
              </div>
            ) : (
              <div className="grid gap-2">
                {classes.map((c) => (
                  <button
                    key={c.class_id}
                    type="button"
                    onClick={() => setSelectedClassId(c.class_id)}
                    className={`text-left rounded-xl border p-4 transition ${
                      selectedClassId === c.class_id
                        ? 'border-gold bg-gold/10'
                        : 'border-slate-200 hover:bg-surface-raised'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <School className="h-4 w-4 text-gold" />
                      <span className="font-semibold">{c.name}</span>
                    </div>
                    {c.grade_level && (
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {c.grade_level}
                      </p>
                    )}
                  </button>
                ))}
              </div>
            )}

            <Button
              onClick={handleChooseClass}
              disabled={classes.length > 0 && !selectedClassId}
              className="w-full font-bold"
            >
              Continue
            </Button>
          </CardContent>
        </Card>
      )}

      {step === 'subjects' && (
        <Card>
          <CardContent className="p-6 space-y-5">
            <div className="space-y-1">
              <h1 className="text-xl font-bold">Your subjects</h1>
              <p className="text-sm text-muted-foreground">
                Core subjects are set for your level. Pick your elective
                {subjects && subjects.electiveMax > 1 ? 's' : ''} below.
              </p>
            </div>

            {subjectsLoading ? (
              <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground py-6">
                <Loader2 className="h-4 w-4 animate-spin" /> Loading subjects…
              </div>
            ) : (
              subjects && (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label className="text-xs uppercase tracking-wide text-muted-foreground">
                      Core (required)
                    </Label>
                    <div className="flex flex-wrap gap-2">
                      {subjects.compulsory.map((s) => (
                        <span
                          key={s.key}
                          className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-surface-raised px-3 py-1.5 text-sm"
                        >
                          <Lock className="h-3 w-3 text-muted-foreground" />
                          {s.label}
                        </span>
                      ))}
                    </div>
                  </div>

                  {subjects.electives.length > 0 && (
                    <div className="space-y-2">
                      <Label className="text-xs uppercase tracking-wide text-muted-foreground">
                        Choose {subjects.electiveMin === subjects.electiveMax
                          ? subjects.electiveMin
                          : `${subjects.electiveMin}–${subjects.electiveMax}`}{' '}
                        elective{subjects.electiveMax === 1 ? '' : 's'}
                      </Label>
                      <div className="grid gap-2">
                        {subjects.electives.map((s) => {
                          const selected = electives.includes(s.key)
                          return (
                            <button
                              key={s.key}
                              type="button"
                              onClick={() => toggleElective(s.key)}
                              className={`flex items-center justify-between rounded-lg border px-3 py-2 text-sm transition ${
                                selected
                                  ? 'border-gold bg-gold/10 font-medium'
                                  : 'border-slate-200 hover:bg-surface-raised'
                              }`}
                            >
                              <span className="flex items-center gap-2">
                                <BookOpen className="h-4 w-4 text-gold" />
                                {s.label}
                              </span>
                              {selected && (
                                <CheckCircle2 className="h-4 w-4 text-gold" />
                              )}
                            </button>
                          )
                        })}
                      </div>
                    </div>
                  )}

                  {subjects.comingSoon.length > 0 && (
                    <div className="space-y-2">
                      <Label className="text-xs uppercase tracking-wide text-muted-foreground">
                        Coming soon
                      </Label>
                      <div className="flex flex-wrap gap-2">
                        {subjects.comingSoon.map((s) => (
                          <span
                            key={s.key}
                            className="inline-flex items-center gap-1.5 rounded-lg border border-dashed border-slate-200 px-3 py-1.5 text-sm text-muted-foreground"
                          >
                            {s.label}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )
            )}

            <Button
              onClick={handleChooseSubjects}
              disabled={savingSubjects || subjectsLoading}
              className="w-full font-bold"
            >
              {savingSubjects ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" /> Saving…
                </>
              ) : (
                'Continue'
              )}
            </Button>
          </CardContent>
        </Card>
      )}

      {step === 'demo' && (
        <Card>
          <CardContent className="p-6 space-y-5">
            <div className="space-y-1">
              <h1 className="text-xl font-bold">A quick taste</h1>
              <p className="text-sm text-muted-foreground">
                Here&apos;s a short, curriculum-grounded lesson — this is how Mirror
                teaches.
              </p>
            </div>

            {demoLoading ? (
              <div className="flex flex-col items-center justify-center gap-2 text-sm text-muted-foreground py-10">
                <Loader2 className="h-5 w-5 animate-spin" />
                Preparing your demo lesson…
              </div>
            ) : demo ? (
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <GraduationCap className="h-4 w-4 text-gold" />
                  <span className="font-semibold">
                    {demo.subject} — {demo.topic}
                  </span>
                </div>
                <div className="rounded-xl border bg-surface-raised/40 p-4 space-y-3 text-sm">
                  {demo.content.introduction && (
                    <p>{demo.content.introduction}</p>
                  )}
                  {demo.content.explanation && (
                    <div>
                      <p className="font-medium mb-1">Key idea</p>
                      <p className="text-muted-foreground whitespace-pre-line">
                        {demo.content.explanation}
                      </p>
                    </div>
                  )}
                  {demo.content.worked_example && (
                    <div>
                      <p className="font-medium mb-1">Worked example</p>
                      <p className="text-muted-foreground whitespace-pre-line">
                        {demo.content.worked_example}
                      </p>
                    </div>
                  )}
                  {demo.content.summary && (
                    <p className="text-xs text-muted-foreground border-t pt-2">
                      {demo.content.summary}
                    </p>
                  )}
                </div>
              </div>
            ) : (
              <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                Your demo lesson isn&apos;t ready yet — no problem, let&apos;s keep
                going and set up your timetable.
              </div>
            )}

            <Button
              onClick={() => setStep('timetable')}
              disabled={demoLoading}
              className="w-full font-bold"
            >
              Looks great — continue
            </Button>
          </CardContent>
        </Card>
      )}

      {step === 'timetable' && (
        <Card>
          <CardContent className="p-6 space-y-5">
            <div className="space-y-1">
              <h1 className="text-xl font-bold">Set your weekly target</h1>
              <p className="text-sm text-muted-foreground">
                Tell us how many hours a week you want to study. We&apos;ll spread it
                across your study days. Change it any time in Settings.
              </p>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Weekly target</Label>
                <span className="text-sm font-semibold text-gold">
                  {weeklyHours}h / week
                </span>
              </div>
              <input
                type="range"
                min={1}
                max={40}
                step={1}
                value={weeklyHours}
                onChange={(e) => setWeeklyHours(Number(e.target.value))}
                className="w-full accent-gold"
              />
              <p className="text-xs text-muted-foreground">
                {studyDays.length > 0 ? (
                  <>≈ <span className="font-medium">{perDayLabel}</span> on each of your{' '}
                  {studyDays.length} study day{studyDays.length === 1 ? '' : 's'}.</>
                ) : (
                  'Pick at least one study day below.'
                )}
              </p>
            </div>

            <div className="space-y-1.5">
              <Label>Study days</Label>
              <div className="flex flex-wrap gap-2">
                {DAYS.map((d) => (
                  <button
                    key={d.i}
                    type="button"
                    onClick={() => toggleDay(d.i)}
                    className={`h-9 w-12 rounded-lg border text-sm transition ${
                      studyDays.includes(d.i)
                        ? 'border-gold bg-gold/10 font-medium'
                        : 'border-slate-200 hover:bg-surface-raised'
                    }`}
                  >
                    {d.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid gap-3">
              <button
                type="button"
                onClick={() => setStudyMode('open')}
                className={`text-left rounded-xl border p-4 transition ${
                  studyMode === 'open'
                    ? 'border-gold bg-gold/10'
                    : 'border-slate-200 hover:bg-surface-raised'
                }`}
              >
                <p className="font-semibold">Flexible (Open)</p>
                <p className="text-sm text-muted-foreground">
                  A daily checklist, no fixed clock. Study whenever suits you, with gentle reminders.
                </p>
              </button>
              <button
                type="button"
                onClick={() => setStudyMode('guided')}
                className={`text-left rounded-xl border p-4 transition ${
                  studyMode === 'guided'
                    ? 'border-gold bg-gold/10'
                    : 'border-slate-200 hover:bg-surface-raised'
                }`}
              >
                <p className="font-semibold">Guided timetable</p>
                <p className="text-sm text-muted-foreground">
                  Fixed start time on the days you choose, with active pace-tracking and stronger nudges.
                </p>
              </button>
            </div>

            {studyMode === 'guided' && (
              <div className="space-y-1.5 rounded-xl border bg-surface-raised/40 p-4">
                <Label className="flex items-center gap-1.5">
                  <Clock className="h-4 w-4" /> Daily start time
                </Label>
                <Input
                  type="time"
                  value={studyTime}
                  onChange={(e) => setStudyTime(e.target.value)}
                  className="w-40"
                />
              </div>
            )}

            <Button
              onClick={handleChooseTimetable}
              disabled={savingPace}
              className="w-full font-bold"
            >
              {savingPace ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" /> Building your timetable…
                </>
              ) : (
                'Unlock my timetable'
              )}
            </Button>
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

      {step === 'results' && result && (
        <Card>
          <CardContent className="p-6 space-y-6">
            <div className="text-center space-y-2">
              <Hourglass className="h-10 w-10 text-amber-500 mx-auto" />
              <h1 className="text-xl font-bold">Request sent!</h1>
              <p className="text-sm text-muted-foreground">
                {selectedClassName
                  ? <>Your request to join <span className="font-medium">{selectedClassName}</span> is pending approval.</>
                  : <>Your request to join is pending approval.</>}
              </p>
              <p className="text-xs text-muted-foreground">
                An admin will review it shortly. We&apos;ll unlock your lessons as soon
                as you&apos;re approved.
              </p>
            </div>

            {result.subjects.length > 0 && (
              <div className="space-y-3">
                <div className="text-center">
                  <p className="text-sm text-muted-foreground">Your starting baseline</p>
                  <p className="text-4xl font-bold text-gold">{result.baseline_pct}%</p>
                  <p className="text-xs text-muted-foreground">
                    Your day-one snapshot — watch it climb as you study.
                  </p>
                </div>
                {result.subjects.map((s) => (
                  <div key={s.subject} className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span className="font-medium">{s.subject}</span>
                      <span className="text-muted-foreground">
                        {s.correct}/{s.total}
                      </span>
                    </div>
                    <div className="h-2 rounded-full bg-surface-raised overflow-hidden">
                      <div
                        className="h-full bg-gold"
                        style={{ width: `${s.score_pct}%` }}
                      />
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {s.score_pct >= 80
                        ? `On track — continuing from week ${s.starting_week}.`
                        : `Starting from week ${s.starting_week} to build a strong base.`}
                      {s.weak_topics.length > 0 &&
                        ` First focus: ${s.weak_topics.slice(0, 3).join(', ')}.`}
                    </p>
                  </div>
                ))}
              </div>
            )}

            {creds && (
              <div className="rounded-xl border bg-surface-raised px-4 py-3 space-y-1">
                <div className="flex items-center gap-2 text-sm font-semibold">
                  <KeyRound className="h-4 w-4" /> Save your login details
                </div>
                <p className="text-xs">
                  School code: <span className="font-mono font-medium">{creds.school_code}</span>
                </p>
                <p className="text-xs">
                  Student ID:{' '}
                  <span className="font-mono font-medium">{creds.student_school_id}</span>
                </p>
                <p className="text-xs">
                  PIN: <span className="font-mono font-medium">{creds.pin}</span>
                </p>
              </div>
            )}

            <Button
              className="w-full font-bold"
              onClick={() => {
                router.push('/student/dashboard')
                router.refresh()
              }}
            >
              Go to my dashboard
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
