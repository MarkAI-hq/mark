'use client'

// src/app/student/join/_components/join-client.tsx

import { useState, useRef, useEffect } from 'react'
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
  AlertCircle,
  Upload,
  FileText,
  Check,
  Wallet,
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
import { updateStudentPaceSettings, type NudgeChannel } from '@/lib/actions/study-plans'
import {
  startDiagnostic,
  submitDiagnostic,
  getSelfEnrollClasses,
  getSelfEnrollSubjects,
  queueDemoLesson,
  pollDemoLesson,
  submitEnrollmentRequest,
  uploadStudentDocument,
  initiateAdmissionPayment,
  getAdmissionFeeStatus,
  redeemAdmissionCode,
  getPledgeStatus,
  acceptPledge,
  type DiagnosticSubject,
  type SubmitDiagnosticResult,
  type SelfEnrollClass,
  type SelfEnrollSubjects,
  type DemoLesson,
} from '@/lib/actions/student-onboarding'

import { LessonPlayer } from '@/app/student/(portal)/study-plans/[planId]/studio/_components/lesson-player'
import { copyProtectionProps } from '@/lib/utils/validation'
import { Badge } from '@/components/ui/badge'

type Step =
  | 'details'
  | 'verify'
  | 'pledge'
  | 'class'
  | 'subjects'
  | 'demo'
  | 'timetable'
  | 'diagnostic'
  | 'upload'
  | 'payment'
  | 'results'

const LEVELS = ['S1', 'S2', 'S3', 'S4', 'S5', 'S6']
const DAYS = [
  { i: 1, label: 'Mon' }, { i: 2, label: 'Tue' }, { i: 3, label: 'Wed' },
  { i: 4, label: 'Thu' }, { i: 5, label: 'Fri' }, { i: 6, label: 'Sat' },
  { i: 0, label: 'Sun' },
]

const PACING_PRESETS = [
  { label: 'Light', hours: 5, desc: 'Quick check-ins' },
  { label: 'Standard', hours: 10, desc: 'Recommended' },
  { label: 'Intense', hours: 18, desc: 'Exam prep' },
]

// ── Inspiring Educational Fallback Illustration Mappings ───────────────────
const SUBJECT_IMAGES: Record<string, string> = {
  physics: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=600&auto=format&fit=crop',
  chemistry: 'https://images.unsplash.com/photo-1532187643603-ba119ca4109e?w=600&auto=format&fit=crop',
  biology: 'https://images.unsplash.com/photo-1530026405186-ed1ea0ac7a63?w=600&auto=format&fit=crop',
  mathematics: 'https://images.unsplash.com/photo-1509228468518-180dd4864904?w=600&auto=format&fit=crop',
  math: 'https://images.unsplash.com/photo-1509228468518-180dd4864904?w=600&auto=format&fit=crop',
  english: 'https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?w=600&auto=format&fit=crop',
  geography: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=600&auto=format&fit=crop',
  history: 'https://images.unsplash.com/photo-1461360370896-922624d12aa1?w=600&auto=format&fit=crop',
}
const GENERAL_FALLBACK_IMAGE = 'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=600&auto=format&fit=crop'

interface Credentials {
  school_code: string
  student_school_id: string
  pin: string
}

interface PendingSignup {
  student_id: string
  channel: 'email' | 'whatsapp'
  school_code: string
  student_school_id: string
  contact?: string
  verify_id?: string
  wa_link?: string
}

// ── Resume-after-disconnect support ─────────────────────────────────────────
// The wizard is otherwise pure in-memory React state — a refresh or lost
// connection mid-signup would normally throw the student back to a blank
// 'details' form, and re-submitting it 500s with "student already exists"
// since the first attempt's account was already created server-side. We
// snapshot just enough to localStorage to resume instead of restart.
//
// Resuming lands on one of three checkpoints rather than the exact step:
//   - 'verify'   — restore `pending` and re-show the OTP/WhatsApp screen.
//   - 'class'    — anywhere from class picking through the diagnostic; these
//                  steps fetch fresh data anyway (classes, subjects, demo,
//                  diagnostic) and are cheap to redo, so we just restart the
//                  loader there instead of trying to restore ephemeral,
//                  server-fetched lists.
//   - 'upload'   — diagnostic already scored (the most costly step to redo)
//                  and/or payment already in flight; resume right there.
type ResumeCheckpoint = 'verify' | 'class' | 'upload'

const CLASS_CHECKPOINT_STEPS: Step[] = ['class', 'subjects', 'demo', 'timetable', 'diagnostic']
const UPLOAD_CHECKPOINT_STEPS: Step[] = ['upload', 'payment', 'results']

interface SavedProgress {
  step: Step
  firstName?: string
  lastName?: string
  level?: string
  email?: string
  phone?: string
  pending?: PendingSignup | null
  creds?: Credentials | null
  selectedClassId?: string
  electives?: string[]
  result?: SubmitDiagnosticResult | null
}

function progressStorageKey(schoolCode: string) {
  return `mi_onboarding_progress:${schoolCode.toUpperCase()}`
}

export function JoinClient({ schoolCode, schoolName }: { schoolCode: string; schoolName?: string }) {
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
  const [pending, setPending] = useState<PendingSignup | null>(null)
  const [code, setCode] = useState('')
  const [verifying, setVerifying] = useState(false)
  const [waState, setWaState] = useState<'waiting' | 'finishing'>('waiting')

  // ── Step: pledge (Mirror Campus Code signature) ─────────────────────────────
  const [pledgeSigned, setPledgeSigned] = useState(false)
  const [pledgeNameTyped, setPledgeNameTyped] = useState('')
  const [pledgeLoading, setPledgeLoading] = useState(false)
  const [pledgeSubmitting, setPledgeSubmitting] = useState(false)

  // ── Step: admission fee payment (MarzPay mobile money — direct charge) ───
  const [paymentPhone, setPaymentPhone] = useState('')
  const [accessCode, setAccessCode] = useState('')
  const [showAccessCode, setShowAccessCode] = useState(false)
  const [redeemingCode, setRedeemingCode] = useState(false)
  const [paymentAmount, setPaymentAmount] = useState(0)
  const [paymentMessage, setPaymentMessage] = useState('')
  const [paymentSubmitted, setPaymentSubmitted] = useState(false)
  const [paymentLoading, setPaymentLoading] = useState(false)
  const [paymentConfirmed, setPaymentConfirmed] = useState(false)

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
  const [demoQueuePosition, setDemoQueuePosition] = useState<number | null>(null)
  const [demoWaitSeconds, setDemoWaitSeconds] = useState(0)
  const [selectedDemoKey, setSelectedDemoKey] = useState<string | null>(null)

  // Two-subject "short interview" picker shown before the demo lesson is
  // generated — one of the student's chosen electives plus a compulsory
  // subject, so they see a contrast between what they picked and a core class.
  const demoOptions = (() => {
    if (!subjects) return []
    const opts: { key: string; label: string }[] = []
    const electiveKey = electives[0]
    const electiveSubject = subjects.electives.find((s) => s.key === electiveKey)
    if (electiveSubject) opts.push(electiveSubject)

    const compulsory = subjects.compulsory.find((s) => s.key !== electiveKey)
    if (compulsory) opts.push(compulsory)

    if (opts.length < 2) {
      const secondElective = subjects.electives.find(
        (s) => !opts.some((o) => o.key === s.key),
      )
      if (secondElective) opts.push(secondElective)
    }
    return opts.slice(0, 2)
  })()

  const DEMO_TEASERS = [
    (name: string, label: string) =>
      `${name}, see what a live ${label} lesson feels like — pick this to try it.`,
    (name: string, label: string) =>
      `Curious how we teach ${label}, ${name}? This one's a quick taste.`,
  ]

  // When there aren't 2 distinct subjects to offer (e.g. no electives chosen
  // and only one compulsory subject came back), skip the picker and run the
  // old single-subject auto-select behavior instead.
  useEffect(() => {
    if (step !== 'demo' || selectedDemoKey || demo || demoLoading) return
    if (demoOptions.length >= 2) return
    const fallbackKey =
      electives[0] ?? subjects?.compulsory[0]?.key ?? subjects?.electives[0]?.key
    if (fallbackKey) startDemoLesson(fallbackKey)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step])

  // Demo-lesson generation runs as a queued job (backend: study-plans queue,
  // 'demo-lesson' job) shared with every other student onboarding at once —
  // so we can poll its real position instead of guessing from elapsed time.
  useEffect(() => {
    if (!demoLoading) {
      setDemoWaitSeconds(0)
      return
    }
    const interval = setInterval(() => setDemoWaitSeconds((s) => s + 1), 1000)
    return () => clearInterval(interval)
  }, [demoLoading])

  const demoWaitMessage =
    demoQueuePosition !== null && demoQueuePosition > 0
      ? `You're #${demoQueuePosition} in line — a lot of students are starting lessons right now, hang tight…`
      : demoWaitSeconds < 6
        ? 'Preparing your interactive lesson…'
        : 'Grounding it in your school’s curriculum…'

  // ── Step 6: weekly-target timetable (WS5) ───────────────────────────────────
  const [studyMode, setStudyMode] = useState<'open' | 'guided'>('open')
  const [studyDays, setStudyDays] = useState<number[]>([1, 2, 3, 4, 5])
  const [studyTime, setStudyTime] = useState('18:00')
  const [weeklyHours, setWeeklyHours] = useState(10)
  const [savingPace, setSavingPace] = useState(false)
  const [showAdvancedSlider, setShowAdvancedSlider] = useState(false)

  // ── Step 8: Document Upload State ───────────────────────────────────────────
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [docType, setDocType] = useState<string>('term_report')
  const [uploadSuccess, setUploadSuccess] = useState(false)
  const [uploading, setUploading] = useState(false)

  // ── Local Validation Error State ───────────────────────────────────────────
  const [localError, setLocalError] = useState<string | null>(null)

  // ── Carried across steps ────────────────────────────────────────────────────
  const [creds, setCreds] = useState<Credentials | null>(null)
  const [diagnostics, setDiagnostics] = useState<DiagnosticSubject[]>([])
  const [answers, setAnswers] = useState<Record<string, number[]>>({})
  const [submitting, setSubmitting] = useState(false)
  const [result, setResult] = useState<SubmitDiagnosticResult | null>(null)

  // ── Resume-after-disconnect ─────────────────────────────────────────────
  const [hasHydrated, setHasHydrated] = useState(false)
  const [resumedFromStorage, setResumedFromStorage] = useState(false)

  function handleStartOver() {
    try {
      localStorage.removeItem(progressStorageKey(schoolCode))
    } catch {
      // best-effort
    }
    setResumedFromStorage(false)
    setStep('details')
    setPending(null)
    setCreds(null)
    setFirstName('')
    setLastName('')
    setLevel('')
    setEmail('')
    setPhone('')
    setSelectedClassId('')
    setElectives([])
    setResult(null)
    setLocalError(null)
  }

  // Restore once on mount. Runs before the save-effect below (declaration
  // order = effect run order on the same commit), so the very first save
  // sees the just-restored state rather than clobbering it with defaults.
  useEffect(() => {
    try {
      const raw = localStorage.getItem(progressStorageKey(schoolCode))
      if (raw) {
        const saved = JSON.parse(raw) as SavedProgress
        if (saved.firstName) setFirstName(saved.firstName)
        if (saved.lastName) setLastName(saved.lastName)
        if (saved.level) setLevel(saved.level)
        if (saved.email) setEmail(saved.email)
        if (saved.phone) setPhone(saved.phone)
        if (saved.pending) setPending(saved.pending)
        if (saved.creds) setCreds(saved.creds)
        if (saved.selectedClassId) setSelectedClassId(saved.selectedClassId)
        if (saved.electives) setElectives(saved.electives)
        if (saved.result) setResult(saved.result)

        if (saved.step === 'verify' && saved.pending) {
          setStep('verify')
          setResumedFromStorage(true)
        } else if (saved.step === 'pledge' && saved.creds) {
          // Not yet in CLASS_CHECKPOINT_STEPS — the pledge itself may still be
          // unsigned, so resume back into the pledge step rather than skipping
          // ahead to class selection.
          setResumedFromStorage(true)
          goToPledgeStep()
        } else if (
          saved.creds &&
          CLASS_CHECKPOINT_STEPS.includes(saved.step)
        ) {
          setResumedFromStorage(true)
          goToClassStep(saved.level)
        } else if (
          saved.creds &&
          UPLOAD_CHECKPOINT_STEPS.includes(saved.step)
        ) {
          setResumedFromStorage(true)
          setStep('upload')
        }
      }
    } catch {
      // corrupt/unavailable storage — just start fresh
    } finally {
      setHasHydrated(true)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Snapshot progress after every meaningful change. Guarded by hasHydrated
  // so the initial render (before restore runs) never overwrites a saved
  // snapshot with blank defaults.
  useEffect(() => {
    if (!hasHydrated) return
    try {
      const key = progressStorageKey(schoolCode)
      if (step === 'details' && !pending) {
        localStorage.removeItem(key)
        return
      }
      const snapshot: SavedProgress = {
        step,
        firstName,
        lastName,
        level,
        email,
        phone,
        pending,
        creds,
        selectedClassId,
        electives,
        result,
      }
      localStorage.setItem(key, JSON.stringify(snapshot))
    } catch {
      // localStorage unavailable (private browsing, quota) — best-effort only
    }
  }, [
    hasHydrated,
    schoolCode,
    step,
    firstName,
    lastName,
    level,
    email,
    phone,
    pending,
    creds,
    selectedClassId,
    electives,
    result,
  ])

  const selectedClassName =
    classes.find((c) => c.class_id === selectedClassId)?.name ?? null

  async function handleEnroll() {
    if (!firstName.trim() || !lastName.trim()) {
      setLocalError('Please enter your name.')
      return
    }
    if (!email.trim()) {
      setLocalError('An email address is required to verify your account.')
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
        setLocalError(error?.message ?? 'Please try again.')
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
      setLocalError(error ?? 'Could not finish sign-up. Please try again.')
      return
    }
    setCreds({
      school_code: pending.school_code,
      student_school_id: pending.student_school_id,
      pin: session.pin,
    })
    goToPledgeStep()
  }

  async function handleVerify() {
    if (!pending || code.trim().length < 4) {
      setLocalError('Enter the code we sent you')
      return
    }
    setVerifying(true)
    try {
      const { data: session, error } = await verifyEnrolOtp({
        student_id: pending.student_id,
        code: code.trim(),
      })
      if (error || !session) {
        setLocalError(error ?? 'Verification failed. Check the code and try again.')
        return
      }
      setCreds({
        school_code: pending.school_code,
        student_school_id: pending.student_school_id,
        pin: session.pin,
      })
      goToPledgeStep()
    } finally {
      setVerifying(false)
    }
  }

  // ── Pledge step: sign the Mirror Campus Code (typed-name signature) ───────
  // The student is authenticated by this point (creds/session just issued),
  // so this is the earliest point we can call the pledge endpoint.
  async function goToPledgeStep() {
    setLocalError(null)
    setStep('pledge')
    setPledgeLoading(true)
    try {
      const { data } = await getPledgeStatus()
      if (data?.signed) {
        setPledgeSigned(true)
        goToClassStep()
      }
    } finally {
      setPledgeLoading(false)
    }
  }

  async function handleSignPledge() {
    setLocalError(null)
    if (!pledgeNameTyped.trim()) {
      setLocalError('Type your full name to sign the code.')
      return
    }
    setPledgeSubmitting(true)
    try {
      const { error } = await acceptPledge(pledgeNameTyped.trim())
      if (error) {
        setLocalError(error.message ?? 'Could not sign the pledge. Please try again.')
        return
      }
      setPledgeSigned(true)
      goToClassStep()
    } finally {
      setPledgeSubmitting(false)
    }
  }

  // ── Payment step: MarzPay admission-fee mobile money — direct charge (last
  // step, right before results are shown). Enters by checking current status
  // only (no phone number needed yet); a fresh charge is only fired once the
  // student submits their number in handleSubmitPayment below — unlike a
  // hosted checkout link, a direct charge can't be safely re-served, so we
  // never auto-fire one on entry/resume.
  async function goToPaymentStep() {
    setLocalError(null)
    setStep('payment')
    setPaymentLoading(true)
    try {
      const { data } = await getAdmissionFeeStatus()
      if (data?.status === 'paid') {
        setPaymentConfirmed(true)
        setStep('results')
        return
      }
      if (data?.amount) setPaymentAmount(data.amount)
      if (!paymentPhone && phone) setPaymentPhone(phone)
      if (data?.status === 'pending') {
        setPaymentSubmitted(true)
        setPaymentMessage('A payment request is already on its way to your phone — check for the PIN prompt.')
        startPaymentPolling()
      }
    } finally {
      setPaymentLoading(false)
    }
  }

  async function handleSubmitPayment() {
    setLocalError(null)
    if (!paymentPhone.trim()) {
      setLocalError('Enter your mobile money number to continue.')
      return
    }
    setPaymentLoading(true)
    try {
      const { data, error } = await initiateAdmissionPayment(paymentPhone.trim())
      if (error || !data) {
        setLocalError(error?.message ?? 'Could not start payment. Please try again.')
        return
      }
      if (data.status === 'paid') {
        setPaymentConfirmed(true)
        setStep('results')
        return
      }
      setPaymentAmount(data.amount)
      setPaymentMessage(data.message)
      setPaymentSubmitted(true)
      startPaymentPolling()
    } finally {
      setPaymentLoading(false)
    }
  }

  // Scholarship / internal-testing bypass — a valid code is a full bypass,
  // no mobile-money charge involved.
  async function handleRedeemCode() {
    setLocalError(null)
    if (!accessCode.trim()) {
      setLocalError('Enter your access code.')
      return
    }
    setRedeemingCode(true)
    try {
      const { data, error } = await redeemAdmissionCode(accessCode.trim())
      if (error || !data) {
        setLocalError(error?.message ?? 'That code did not work. Please check it and try again.')
        return
      }
      setPaymentConfirmed(true)
      setStep('results')
    } finally {
      setRedeemingCode(false)
    }
  }

  // Poll for confirmation while the student's phone is prompting them,
  // mirroring the WhatsApp click-to-chat polling pattern above.
  function startPaymentPolling() {
    const id = setInterval(async () => {
      const { data } = await getAdmissionFeeStatus()
      if (data?.status === 'paid') {
        clearInterval(id)
        setPaymentConfirmed(true)
        setStep('results')
      }
    }, 3000)
  }

  // ── Class step ──────────────────────────────────────────────────────────────
  // Accepts an explicit level override for the resume-from-storage path, where
  // `level` state was just set in the same effect and hasn't re-rendered yet
  // (so the closure here would otherwise still see the pre-restore value).
  async function goToClassStep(levelOverride?: string) {
    setStep('class')
    setClassesLoading(true)
    try {
      const { data } = await getSelfEnrollClasses(schoolCode, (levelOverride ?? level) || undefined)
      setClasses(data?.classes ?? [])
    } finally {
      setClassesLoading(false)
    }
  }

  async function handleChooseClass() {
    if (!selectedClassId) {
      setLocalError('Pick a class to request to join')
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
        if (max === 1) return [key]
        setLocalError(`Choose up to ${max} electives`)
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
      setLocalError(`Choose ${range} elective${max === 1 ? '' : 's'}`)
      return
    }
    setSavingSubjects(true)
    try {
      const { error } = await submitEnrollmentRequest({
        requested_class_id: selectedClassId,
        elective_subjects: electives,
      })
      if (error) {
        setLocalError(error.message ?? 'Could not save your choices. Please try again.')
        return
      }
      setStep('demo')
    } finally {
      setSavingSubjects(false)
    }
  }

  // ── Demo step ─────────────────────────────────────────────────────────────
  const DEMO_POLL_INTERVAL_MS = 1500
  const DEMO_POLL_MAX_ATTEMPTS = 60 // ~90s ceiling before we give up and let the student skip

  async function startDemoLesson(demoSubjectKey: string) {
    setLocalError(null)
    setSelectedDemoKey(demoSubjectKey)
    setDemoLoading(true)
    setDemoQueuePosition(null)
    try {
      if (!demoSubjectKey) return

      // Pass the student's name parameters to trigger advanced server-side AI personalization [4]
      const { data: queued, error: queueError } = await queueDemoLesson(
        schoolCode,
        level || undefined,
        demoSubjectKey,
        firstName.trim(),
      )
      if (queueError || !queued?.job_id) return

      for (let attempt = 0; attempt < DEMO_POLL_MAX_ATTEMPTS; attempt++) {
        await new Promise((r) => setTimeout(r, DEMO_POLL_INTERVAL_MS))
        const { data: poll } = await pollDemoLesson(queued.job_id)
        if (!poll) continue

        if (poll.status === 'waiting' || poll.status === 'active') {
          setDemoQueuePosition(poll.status === 'waiting' ? poll.position : 0)
          continue
        }
        if (poll.status === 'completed') {
          setDemo(poll.result)
        }
        // 'failed' / 'not_found' fall through — demo stays null, existing
        // fallback UI lets the student skip straight to the timetable step.
        break
      }
    } finally {
      setDemoLoading(false)
      setDemoQueuePosition(null)
    }
  }

  // ── Timetable step ──────────────────────────────────────────────────────────
  function toggleDay(i: number) {
    setLocalError(null)
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
      setLocalError('Pick at least one study day.')
      return
    }
    setLocalError(null)
    setSavingPace(true)

    const calculatedLessonsPerDay = weeklyHours >= 15 ? 3 : weeklyHours >= 7 ? 2 : 1
    const initialNudgeChannels: NudgeChannel[] = pending.channel === 'whatsapp'
      ? ['whatsapp', 'in_app']
      : ['email', 'in_app']

    try {
      await updateStudentPaceSettings(pending.student_id, {
        lessons_per_day: calculatedLessonsPerDay,
        preferred_reminder_time: studyMode === 'guided' ? studyTime : '18:00',
        reminder_enabled: true,
        study_mode: studyMode,
        study_days: studyDays,
        weekly_target_hours: weeklyHours,
        nudge_channels: initialNudgeChannels,
      })
      await loadDiagnostic()
    } finally {
      setSavingPace(false)
    }
  }

  // ── Diagnostic step ───────────────────────────────────────────────────────
  async function loadDiagnostic() {
    setLocalError(null)
    const { data: diag } = await startDiagnostic()
    const subs = diag?.diagnostics ?? []
    if (subs.length === 0) {
      setResult({ baseline_pct: 0, subjects: [], plan_status: 'pending' })
      setStep('upload')
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
    setLocalError(null)
    setSubmitting(true)
    try {
      const { data, error } = await submitDiagnostic({
        results: diagnostics.map((d) => ({
          assessment_id: d.assessment_id,
          answers: (answers[d.assessment_id] ?? []).map((a) => (a < 0 ? -1 : a)),
        })),
      })
      if (error || !data) {
        setLocalError(error?.message ?? 'Could not submit results. Please try again.')
        return
      }
      setResult(data)
      setStep('upload')
    } finally {
      setSubmitting(false)
    }
  }

  // ── Document Upload Submission ─────────────────────────────────────────────
  function handleDocumentSubmit() {
    if (!selectedFile) {
      toast({ title: 'Please select a file to upload.', variant: 'destructive' })
      return
    }

    setUploading(true)
    const fd = new FormData()
    fd.append('file', selectedFile)
    fd.append('doc_type', docType)

    uploadStudentDocument(fd)
      .then(({ error }) => {
        setUploading(false)
        if (error) {
          toast({ title: error.message, variant: 'destructive' })
          return
        }
        
        if (pending?.student_id) {
          localStorage.setItem(`proof_uploaded_${pending.student_id}`, 'true')
        }
        
        toast({ title: 'Document uploaded successfully!' })
        setUploadSuccess(true)
        setSelectedFile(null)
        if (fileInputRef.current) fileInputRef.current.value = ''
      })
      .catch(() => {
        setUploading(false)
        toast({ title: 'Upload failed. Please try again.', variant: 'destructive' })
      })
  }

  // ── Fallback 5E interactive scenes builder (Highly Personalized) ───────────
  const demoScenes = (() => {
    if (!demo) return []
    
    const subjectKey = demo.subject.toLowerCase()
    const fallbackVisual = SUBJECT_IMAGES[subjectKey] ?? GENERAL_FALLBACK_IMAGE

    // Ensure all backend scenes are populated with fallbacks if media properties are missing [1, 4]
    const backendScenes = demo.content.scenes as any[] | undefined
    if (backendScenes && backendScenes.length > 0) {
      return backendScenes.map((s) => ({
        ...s,
        image_url: s.image_url ?? fallbackVisual, // Visual coverage guard [4]
        tts_script: s.tts_script ?? s.content?.text ?? s.title, // Audio narration fallback trigger [1]
      }))
    }

    const synthesized: any[] = []
    const { introduction, explanation, worked_example, summary, practice_questions } = demo.content

    // We inject high-fidelity personalization containing the student's name on-the-fly [1, 4]
    if (introduction) {
      const personalizedIntro = `Hello ${firstName}! Welcome to your demo class. Today, let's explore ${demo.topic} in ${demo.subject}. ` + introduction
      synthesized.push({
        type: 'slide',
        title: 'Introduction',
        five_e_stage: 'Engage',
        bloom_level: 'remember',
        estimated_seconds: 60,
        tts_script: personalizedIntro, // Triggers Web Speech vocalization [1]
        content: { text: personalizedIntro },
        image_url: fallbackVisual, // Injects rich high-resolution illustrations [4]
      })
    }

    if (explanation) {
      const personalizedExplanation = `${firstName}, here is a core concept that we should focus on: ` + explanation
      synthesized.push({
        type: 'slide',
        title: 'Key Concepts',
        five_e_stage: 'Explain',
        bloom_level: 'understand',
        estimated_seconds: 120,
        tts_script: personalizedExplanation,
        content: { text: personalizedExplanation },
        image_url: fallbackVisual,
      })
    }

    if (worked_example) {
      const personalizedExample = `${firstName}, let's analyze this worked example together to see how these equations resolve: ` + worked_example
      synthesized.push({
        type: 'slide',
        title: 'Worked Example',
        five_e_stage: 'Apply',
        bloom_level: 'apply',
        estimated_seconds: 90,
        tts_script: personalizedExample,
        content: { text: personalizedExample },
        image_url: fallbackVisual,
      })
    }

    if (practice_questions && practice_questions.length > 0) {
      practice_questions.forEach((pq, i) => {
        const textPrompt = `${firstName}, look at this question: ${pq.question}`
        synthesized.push({
          type: 'slide',
          title: `Practice Challenge ${i + 1}`,
          five_e_stage: 'Apply',
          bloom_level: 'apply',
          estimated_seconds: 60,
          tts_script: textPrompt,
          content: {
            text: textPrompt,
            bullets: [`Correct Answer: ${pq.answer}`],
          },
          image_url: fallbackVisual,
        })
      })
    }

    if (summary) {
      const personalizedSummary = `Great progress, ${firstName}! Here is what we covered today: ` + summary
      synthesized.push({
        type: 'slide',
        title: 'Key Takeaways',
        five_e_stage: 'Elaborate',
        bloom_level: 'understand',
        estimated_seconds: 45,
        tts_script: personalizedSummary,
        content: { text: personalizedSummary },
        image_url: fallbackVisual,
      })
    }

    return synthesized
  })()

  // ── Render ───────────────────────────────────────────────────────────────────
  return (
    <div className="w-full max-w-2xl">
      <div className="flex items-center gap-2 mb-6 justify-center">
        <Sparkles className="h-5 w-5 text-gold" />
        <span className="font-semibold tracking-tight">Mirror Intelligence Online High School</span>
      </div>

      {resumedFromStorage && step !== 'details' && (
        <div className="mb-4 flex items-center justify-center gap-2 text-xs text-muted-foreground">
          <span>Welcome back — continuing where you left off.</span>
          <button
            type="button"
            onClick={handleStartOver}
            className="underline hover:text-foreground"
          >
            Not you? Start over
          </button>
        </div>
      )}

      {step === 'details' && (
        <Card>
          <CardContent className="p-6 space-y-5">
            <div className="space-y-1">
              <h1 className="text-xl font-bold">Do you have what it takes to study here?</h1>
              <p className="text-sm text-muted-foreground">
                Create your free student account. We&apos;ll check what you already
                know and build a plan around the gaps.
              </p>
            </div>

            {/* ── Notice: What you will need ───────────────────────────────────── */}
            <div className="rounded-xl border border-amber-200 bg-amber-50/50 p-4 text-xs text-amber-900 space-y-2 dark:border-amber-900/40 dark:bg-amber-950/20 dark:text-amber-100">
              <p className="font-semibold flex items-center gap-1.5 text-amber-800 dark:text-amber-300">
                <AlertCircle className="h-4 w-4 shrink-0" /> What you will need before you begin:
              </p>
              <ul className="list-disc pl-5 space-y-1 text-muted-foreground leading-relaxed">
                <li>
                  <span className="font-medium text-foreground">Active Email Address:</span> Used to verify your account.
                </li>
                <li>
                  <span className="font-medium text-foreground">Report Card or Results (Optional):</span> A photo or document to upload at the end, helping teachers approve your account faster.
                </li>
                <li>
                  <span className="font-medium text-foreground">15 Minutes of Uninterrupted Time:</span> To complete a quick diagnostic check to map your learning strengths.
                </li>
              </ul>
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
              We&apos;ll verify your account contact. Mirror Intelligence Online High School is live in Uganda and expanding soon.
            </p>

            {localError && (
              <p className="text-xs text-rose-500 font-medium flex items-center gap-1">
                <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                {localError}
              </p>
            )}

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
              Joining <span className="font-medium">{schoolName || schoolCode}</span>. Already have
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

            {localError && (
              <p className="text-xs text-rose-500 font-medium flex items-center justify-center gap-1 mt-2">
                <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                {localError}
              </p>
            )}

            <button
              type="button"
              onClick={() => {
                setLocalError(null)
                setStep('details')
              }}
              className="w-full text-center text-xs text-muted-foreground underline mt-2"
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

            {localError && (
              <p className="text-xs text-rose-500 font-medium flex items-center gap-1">
                <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                {localError}
              </p>
            )}

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
              onClick={() => {
                setLocalError(null)
                setStep('details')
              }}
              className="w-full text-center text-xs text-muted-foreground underline"
            >
              Wrong contact? Go back
            </button>
          </CardContent>
        </Card>
      )}

      {step === 'pledge' && (
        <Card>
          <CardContent className="p-6 space-y-5">
            <div className="space-y-1">
              <h1 className="text-xl font-bold">The Mirror Campus Code</h1>
              <p className="text-sm text-muted-foreground">
                Before you continue, read and sign the code every Mirror Campus student agrees to.
              </p>
            </div>

            {pledgeLoading ? (
              <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground py-6">
                <Loader2 className="h-4 w-4 animate-spin" /> Loading…
              </div>
            ) : (
              <>
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
                    placeholder={firstName && lastName ? `${firstName} ${lastName}` : 'Your full name'}
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
              </>
            )}

            {localError && (
              <p className="text-xs text-rose-500 font-medium flex items-center gap-1">
                <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                {localError}
              </p>
            )}
          </CardContent>
        </Card>
      )}

      {step === 'payment' && (
        <Card>
          <CardContent className="p-6 space-y-5 text-center">
            <div className="space-y-1">
              <h1 className="text-xl font-bold">Pay your admission fee</h1>
              <p className="text-sm text-muted-foreground">
                A one-time admission fee confirms your place. Enter your MTN
                or Airtel number and approve the prompt on your phone — it
                only takes a minute.
              </p>
            </div>

            {paymentLoading ? (
              <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground py-6">
                <Loader2 className="h-4 w-4 animate-spin" /> Preparing payment…
              </div>
            ) : paymentConfirmed ? (
              <div className="flex items-center justify-center gap-2 text-sm text-emerald-600 py-2">
                <Check className="h-4 w-4" /> Payment received — continuing…
              </div>
            ) : paymentSubmitted ? (
              <>
                <div className="rounded-xl border bg-surface-raised px-4 py-3">
                  <p className="text-xs text-muted-foreground">Admission fee</p>
                  <p className="text-2xl font-bold">
                    UGX {paymentAmount.toLocaleString()}
                  </p>
                </div>
                <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground text-left">
                  <Loader2 className="h-4 w-4 animate-spin shrink-0" />
                  <span>{paymentMessage || 'Check your phone for a PIN prompt…'}</span>
                </div>
                <button
                  type="button"
                  onClick={() => setPaymentSubmitted(false)}
                  className="text-xs text-muted-foreground underline"
                >
                  Didn&apos;t get a prompt? Try a different number
                </button>
              </>
            ) : (
              <>
                {paymentAmount > 0 && (
                  <div className="rounded-xl border bg-surface-raised px-4 py-3">
                    <p className="text-xs text-muted-foreground">Admission fee</p>
                    <p className="text-2xl font-bold">
                      UGX {paymentAmount.toLocaleString()}
                    </p>
                  </div>
                )}
                <div className="space-y-1.5 text-left">
                  <Label>Mobile money number</Label>
                  <Input
                    type="tel"
                    placeholder="07XXXXXXXX"
                    value={paymentPhone}
                    onChange={(e) => setPaymentPhone(e.target.value)}
                  />
                </div>
                <Button className="w-full font-bold" onClick={handleSubmitPayment}>
                  <Wallet className="h-4 w-4 mr-2" /> Send payment request
                </Button>

                {!showAccessCode ? (
                  <button
                    type="button"
                    onClick={() => setShowAccessCode(true)}
                    className="text-xs text-muted-foreground underline"
                  >
                    Have a scholarship or access code?
                  </button>
                ) : (
                  <div className="space-y-1.5 text-left pt-2 border-t">
                    <Label>Access code</Label>
                    <div className="flex gap-2">
                      <Input
                        placeholder="SCHOLAR-XXXX"
                        value={accessCode}
                        onChange={(e) => setAccessCode(e.target.value)}
                        className="uppercase"
                      />
                      <Button
                        variant="secondary"
                        onClick={handleRedeemCode}
                        disabled={redeemingCode}
                      >
                        {redeemingCode ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Redeem'}
                      </Button>
                    </div>
                  </div>
                )}
              </>
            )}

            {localError && (
              <p className="text-xs text-rose-500 font-medium flex items-center justify-center gap-1">
                <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                {localError}
              </p>
            )}
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
                    onClick={() => {
                      setLocalError(null)
                      setSelectedClassId(c.class_id)
                    }}
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

            {localError && (
              <p className="text-xs text-rose-500 font-medium flex items-center gap-1">
                <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                {localError}
              </p>
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
                    <div className="flex justify-between items-center">
                      <Label className="text-xs uppercase tracking-wide text-muted-foreground">
                        Core (required)
                      </Label>
                    </div>
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
                      <div className="flex justify-between items-center">
                        <Label className="text-xs uppercase tracking-wide text-muted-foreground">
                          Choose {subjects.electiveMin === subjects.electiveMax
                            ? subjects.electiveMin
                            : `${subjects.electiveMin}–${subjects.electiveMax}`}{' '}
                          elective{subjects.electiveMax === 1 ? '' : 's'}
                        </Label>
                        <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                          {electives.length} of {subjects.electiveMax} chosen
                        </Badge>
                      </div>
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
                                  ? 'border-gold bg-gold/10 font-semibold'
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

            {localError && (
              <p className="text-xs text-rose-500 font-medium flex items-center gap-1">
                <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                {localError}
              </p>
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
        <Card className="min-h-[500px] h-[580px] flex flex-col overflow-hidden">
          {!selectedDemoKey && !demoLoading && !demo && demoOptions.length >= 2 ? (
            <CardContent className="p-6 flex flex-col justify-center h-full gap-5">
              <div className="space-y-1 text-center">
                <h1 className="text-xl font-bold">Quick interview</h1>
                <p className="text-sm text-muted-foreground">
                  Let&apos;s do a short interview to find your starting point.
                  Pick a subject and we&apos;ll run a live demo lesson.
                </p>
              </div>
              <div className="grid gap-3">
                {demoOptions.map((opt, i) => (
                  <button
                    key={opt.key}
                    type="button"
                    onClick={() => startDemoLesson(opt.key)}
                    className="text-left rounded-xl border border-slate-200 p-4 transition hover:border-gold hover:bg-gold/10"
                  >
                    <div className="flex items-center gap-2 font-semibold">
                      <BookOpen className="h-4 w-4 text-gold" />
                      {opt.label}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {DEMO_TEASERS[i % DEMO_TEASERS.length](firstName.trim() || 'Hey', opt.label)}
                    </p>
                  </button>
                ))}
              </div>
            </CardContent>
          ) : !selectedDemoKey && !demoLoading && !demo ? (
            <CardContent className="p-6 flex flex-col items-center justify-center h-full gap-2 text-sm text-muted-foreground text-center">
              <Loader2 className="h-5 w-5 animate-spin" />
            </CardContent>
          ) : demoLoading ? (
            <CardContent className="p-6 flex flex-col items-center justify-center h-full gap-2 text-sm text-muted-foreground text-center">
              {demoWaitSeconds < 15 ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <Hourglass className="h-5 w-5 text-amber-500" />
              )}
              <span className="max-w-xs">{demoWaitMessage}</span>
            </CardContent>
          ) : demo && demoScenes.length > 0 ? (
            <div className="flex-1 min-h-0">
              <LessonPlayer
                scenes={demoScenes}
                subject={demo.subject}
                topic={demo.topic}
                completeLabel="Continue to Timetable"
                onComplete={() => setStep('timetable')}
              />
            </div>
          ) : (
            <CardContent className="p-6 flex flex-col items-center justify-center h-full gap-4 text-center">
              <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 max-w-md">
                Your demo lesson isn&apos;t ready yet — let&apos;s keep
                going and set up your timetable.
              </div>
              <Button
                onClick={() => setStep('timetable')}
                className="font-bold w-48"
              >
                Skip to Timetable
              </Button>
            </CardContent>
          )}
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

            {/* ── Dynamic Target Presets to lower cognitive load ─────────────────── */}
            <div className="space-y-1.5">
              <Label>Choose your study target</Label>
              <div className="grid grid-cols-3 gap-2.5">
                {PACING_PRESETS.map((preset) => {
                  const active = weeklyHours === preset.hours && !showAdvancedSlider
                  return (
                    <button
                      key={preset.label}
                      type="button"
                      onClick={() => {
                        setLocalError(null)
                        setWeeklyHours(preset.hours)
                        setShowAdvancedSlider(false)
                      }}
                      className={`flex flex-col items-center justify-center p-3 rounded-xl border text-center transition-colors ${
                        active
                          ? 'border-gold bg-gold/10 font-semibold text-gold shadow-sm'
                          : 'border-slate-200 hover:bg-surface-raised'
                      }`}
                    >
                      <span className="text-[10px] uppercase font-semibold text-muted-foreground/80 tracking-wider">
                        {preset.label}
                      </span>
                      <span className="text-lg font-bold mt-1">
                        {preset.hours}h
                      </span>
                      <span className="text-[9px] text-muted-foreground leading-tight mt-0.5 max-w-[80px]">
                        {preset.desc}
                      </span>
                    </button>
                  )
                })}
              </div>
            </div>

            <div className="text-right">
              <button
                type="button"
                onClick={() => setShowAdvancedSlider(!showAdvancedSlider)}
                className="text-xs text-gold underline hover:text-gold/90 font-medium animate-pulse"
              >
                {showAdvancedSlider ? 'Use standard presets' : 'Set custom study hours'}
              </button>
            </div>

            {/* Collapsible custom study hours slider */}
            {showAdvancedSlider && (
              <div className="space-y-2 border border-dashed border-border/70 rounded-xl p-3 bg-muted/10 animate-in fade-in slide-in-from-top-1 duration-200">
                <div className="flex items-center justify-between">
                  <Label>Custom weekly target</Label>
                  <span className="text-xs font-semibold text-gold">
                    {weeklyHours} hours
                  </span>
                </div>
                <input
                  type="range"
                  min={1}
                  max={40}
                  step={1}
                  value={weeklyHours}
                  onChange={(e) => {
                    setLocalError(null)
                    setWeeklyHours(Number(e.target.value))
                  }}
                  className="w-full accent-gold cursor-pointer"
                />
              </div>
            )}

            <p className="text-xs text-muted-foreground leading-normal">
              {studyDays.length > 0 ? (
                <>≈ <span className="font-semibold text-foreground">{perDayLabel}</span> of study on each of your{' '}
                <span className="font-medium text-foreground">{studyDays.length} chosen day{studyDays.length === 1 ? '' : 's'}</span>.</>
              ) : (
                'Pick at least one study day below.'
              )}
            </p>

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
                        ? 'border-gold bg-gold/10 font-semibold text-gold shadow-sm'
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
                onClick={() => {
                  setLocalError(null)
                  setStudyMode('open')
                }}
                className={`text-left rounded-xl border p-4 transition ${
                  studyMode === 'open'
                    ? 'border-gold bg-gold/10'
                    : 'border-slate-200 hover:bg-surface-raised'
                }`}
              >
                <p className="font-semibold text-sm">Flexible (Open)</p>
                <p className="text-xs text-muted-foreground mt-0.5 leading-normal">
                  A daily checklist, no fixed clock. Study whenever suits you, with gentle reminder updates.
                </p>
              </button>
              <button
                type="button"
                onClick={() => {
                  setLocalError(null)
                  setStudyMode('guided')
                }}
                className={`text-left rounded-xl border p-4 transition ${
                  studyMode === 'guided'
                    ? 'border-gold bg-gold/10'
                    : 'border-slate-200 hover:bg-surface-raised'
                }`}
              >
                <p className="font-semibold text-sm">Guided timetable</p>
                <p className="text-xs text-muted-foreground mt-0.5 leading-normal">
                  Fixed start time on the days you choose, with active pace-tracking and stronger nudge schedules.
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
                  onChange={(e) => {
                    setLocalError(null)
                    setStudyTime(e.target.value)
                  }}
                  className="w-40 text-xs h-9"
                />
              </div>
            )}

            {localError && (
              <p className="text-xs text-rose-500 font-medium flex items-center gap-1">
                <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                {localError}
              </p>
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

            {localError && (
              <p className="text-xs text-rose-500 font-medium flex items-center gap-1">
                <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                {localError}
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

      {step === 'upload' && (
        <Card>
          <CardContent className="p-6 space-y-5">
            <div className="space-y-1">
              <h1 className="text-xl font-bold">Speed up your school approval</h1>
              <p className="text-sm text-muted-foreground">
                Optionally upload a photo or PDF of your last term report card or
                exam results so your school can verify your class and accept your
                request faster. You can skip this and add it later.
              </p>
            </div>

            <div className="w-full border border-border/70 rounded-xl p-4 bg-muted/10 text-left space-y-4">
              <div className="flex items-start gap-2.5">
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-gold/10 text-gold">
                  <Upload className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-foreground">Proof of class document</p>
                  <p className="text-[11px] text-muted-foreground mt-0.5 leading-normal">
                    Term report card, prior exam results, or another document showing your class.
                  </p>
                </div>
              </div>

              {uploadSuccess && (
                <div className="flex items-center gap-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20 p-3 text-emerald-800 dark:text-emerald-300 text-xs font-medium">
                  <Check className="h-4 w-4 text-emerald-500 shrink-0" />
                  <span>Document uploaded! Your administrator can now view it.</span>
                </div>
              )}

              <div className="space-y-3 pt-1">
                <div className="grid grid-cols-2 gap-2.5">
                  <div className="space-y-1">
                    <Label className="text-[10px] uppercase font-semibold text-muted-foreground tracking-wider">Document Type</Label>
                    <Select value={docType} onValueChange={setDocType}>
                      <SelectTrigger className="h-8 text-xs">
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="term_report">Term Report Card</SelectItem>
                        <SelectItem value="prior_results">Prior Exam Results</SelectItem>
                        <SelectItem value="other">Other Document</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1">
                    <Label className="text-[10px] uppercase font-semibold text-muted-foreground tracking-wider">Choose File</Label>
                    <div className="relative">
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*,application/pdf"
                        onChange={(e) => {
                          setSelectedFile(e.target.files?.[0] ?? null)
                          setUploadSuccess(false)
                        }}
                        className="hidden"
                        id="onboarding-doc-file"
                      />
                      <label
                        htmlFor="onboarding-doc-file"
                        className="flex h-8 w-full items-center justify-center gap-1 px-3 border border-input rounded-lg bg-background hover:bg-muted text-xs cursor-pointer truncate font-medium transition-colors"
                      >
                        <FileText className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                        <span className="truncate">{selectedFile ? selectedFile.name : 'Select PDF/Photo'}</span>
                      </label>
                    </div>
                  </div>
                </div>

                {selectedFile && (
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={handleDocumentSubmit}
                      disabled={uploading}
                      className="h-8 text-xs font-bold flex-1"
                    >
                      {uploading ? (
                        <>
                          <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />
                          Uploading…
                        </>
                      ) : (
                        'Submit'
                      )}
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setSelectedFile(null)}
                      disabled={uploading}
                      className="h-8 text-xs text-muted-foreground"
                    >
                      Cancel
                    </Button>
                  </div>
                )}
              </div>
            </div>

            <Button onClick={goToPaymentStep} className="w-full font-bold">
              {uploadSuccess ? 'Continue' : 'Skip for now'}
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
                try {
                  localStorage.removeItem(progressStorageKey(schoolCode))
                } catch {
                  // best-effort
                }
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
