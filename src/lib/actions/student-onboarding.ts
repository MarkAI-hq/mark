'use server'

// src/lib/actions/student-onboarding.ts
// Marketplace student onboarding: diagnostic generate + submit.

import { cookies } from 'next/headers'
import { fetcher } from '@/lib/fetch'
import type { ServerActionResponse } from '@/lib/types'

export interface DiagnosticQuestion {
  topic: string
  question: string
  options: string[]
}

export interface DiagnosticSubject {
  assessment_id: string
  subject: string
  questions: DiagnosticQuestion[]
}

export interface StartDiagnosticResult {
  diagnostics: DiagnosticSubject[]
}

export interface SubmitDiagnosticPayload {
  results: { assessment_id: string; answers: number[] }[]
}

export interface DiagnosticSubjectResult {
  subject: string
  correct: number
  total: number
  score_pct: number
  weak_topics: string[]
  starting_week: number
}

export interface SubmitDiagnosticResult {
  baseline_pct: number
  subjects: DiagnosticSubjectResult[]
  plan_status: string
}

// ── Onboarding: classes / subjects / demo (public) + request (authenticated) ──

export interface SelfEnrollClass {
  class_id: string
  name: string
  grade_level: string | null
}

export interface CatalogSubjectView {
  key: string
  label: string
}

export interface SelfEnrollSubjects {
  compulsory: CatalogSubjectView[]
  electives: CatalogSubjectView[]
  comingSoon: CatalogSubjectView[]
  electiveMin: number
  electiveMax: number
  joinNotice: string
}

export interface DemoLesson {
  subject: string
  topic: string
  level: string | null
  content: {
    lesson_type: string
    topic: string
    subject: string
    introduction: string
    explanation: string
    worked_example: string
    practice_questions: { question: string; answer: string }[]
    summary: string
    estimated_minutes: number
    scenes?: unknown[]
  }
}

export async function getSelfEnrollClasses(
  schoolCode: string,
  level?: string,
): Promise<ServerActionResponse<{ classes: SelfEnrollClass[] }>> {
  const qs = new URLSearchParams({ school_code: schoolCode })
  if (level) qs.set('level', level)
  return fetcher(`/students/self-enroll/classes?${qs.toString()}`, {
    cache: 'no-store',
  })
}

export async function getSelfEnrollSubjects(
  schoolCode: string,
  level?: string,
): Promise<ServerActionResponse<SelfEnrollSubjects>> {
  const qs = new URLSearchParams({ school_code: schoolCode })
  if (level) qs.set('level', level)
  return fetcher(`/students/self-enroll/subjects?${qs.toString()}`, {
    cache: 'no-store',
  })
}

export async function queueDemoLesson(
  schoolCode: string,
  level?: string,
  subject?: string,
  firstName?: string,
): Promise<ServerActionResponse<{ job_id: string }>> {
  return fetcher<{ job_id: string }>('/study-plans/demo-lesson', {
    method: 'POST',
    body: JSON.stringify({ school_code: schoolCode, level, subject, first_name: firstName }),
    cache: 'no-store',
  })
}

export type DemoLessonPoll =
  | { status: 'waiting' | 'active'; position: number }
  | { status: 'completed'; result: DemoLesson }
  | { status: 'failed'; reason?: string }
  | { status: 'not_found' }

export async function pollDemoLesson(
  jobId: string,
): Promise<ServerActionResponse<DemoLessonPoll>> {
  return fetcher<DemoLessonPoll>(`/study-plans/demo-lesson/status/${jobId}`, {
    cache: 'no-store',
  })
}

export interface AdmissionFeePayment {
  status: 'pending' | 'paid'
  amount: number
  message: string
}

export interface AdmissionFeeStatus {
  status: 'unpaid' | 'pending' | 'paid' | 'failed'
  amount: number | null
  paid_at: string | null
}

// Charges the phone number directly (MarzPay "Collections") — the student
// gets a PIN prompt on their phone immediately, no hosted checkout page.
export async function initiateAdmissionPayment(
  phoneNumber: string,
): Promise<ServerActionResponse<AdmissionFeePayment>> {
  return fetcher<AdmissionFeePayment>('/students/me/admission-fee/initiate', {
    method: 'POST',
    body: JSON.stringify({ phone_number: phoneNumber }),
    cache: 'no-store',
  })
}

export async function getAdmissionFeeStatus(): Promise<
  ServerActionResponse<AdmissionFeeStatus>
> {
  return fetcher<AdmissionFeeStatus>('/students/me/admission-fee/status', {
    cache: 'no-store',
  })
}

// A valid code is a full bypass — no mobile-money charge, no admin step.
export async function redeemAdmissionCode(
  code: string,
): Promise<ServerActionResponse<{ status: 'paid'; amount: number }>> {
  return fetcher('/students/me/admission-fee/redeem-code', {
    method: 'POST',
    body: JSON.stringify({ code }),
    cache: 'no-store',
  })
}

export interface PledgeStatus {
  signed: boolean
  pledge_version: string | null
}

export async function getPledgeStatus(): Promise<ServerActionResponse<PledgeStatus>> {
  return fetcher<PledgeStatus>('/students/me/pledge', { cache: 'no-store' })
}

export async function acceptPledge(
  fullNameTyped: string,
): Promise<ServerActionResponse<{ signed: true; accepted_at: string }>> {
  const result = await fetcher<{ signed: true; accepted_at: string }>(
    '/students/me/pledge',
    {
      method: 'POST',
      body: JSON.stringify({ full_name_typed: fullNameTyped }),
      cache: 'no-store',
    },
  )

  // The pledge is the only remaining onboarding requirement for a 'direct'
  // (admin-added) student — mirrors Admin's completeOnboarding() cookie patch
  // in onboarding.ts. Without this, the 'user' cookie keeps the stale
  // onboarding_complete:false from login and middleware.ts redirects the
  // student back into /student/finish-setup forever, even though the backend
  // now considers them done.
  if (!result.error) {
    const cookieStore = await cookies()
    const existing = cookieStore.get('user')?.value
    if (existing) {
      const parsed = JSON.parse(decodeURIComponent(existing))
      cookieStore.set(
        'user',
        encodeURIComponent(JSON.stringify({ ...parsed, onboarding_complete: true })),
        {
          secure:   process.env.NODE_ENV === 'production',
          sameSite: 'lax',
          path:     '/',
          maxAge:   60 * 60 * 24 * 7,
        },
      )
    }
  }

  return result
}

export async function submitEnrollmentRequest(payload: {
  requested_class_id?: string
  elective_subjects?: string[]
}): Promise<
  ServerActionResponse<{
    enrollment_status: string
    requested_class_id: string | null
  }>
> {
  return fetcher('/students/me/enrollment-request', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export async function startDiagnostic(): Promise<
  ServerActionResponse<StartDiagnosticResult>
> {
  return fetcher<StartDiagnosticResult>('/onboarding/diagnostic/start', {
    method: 'POST',
    cache: 'no-store',
  })
}

export async function submitDiagnostic(
  payload: SubmitDiagnosticPayload,
): Promise<ServerActionResponse<SubmitDiagnosticResult>> {
  return fetcher<SubmitDiagnosticResult>('/onboarding/diagnostic/submit', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export type SceneType =
  | 'slide'
  | 'quiz'
  | 'simulation'
  | 'whiteboard'
  | 'pbl_stage'
  | 'cornell_notes'
  // ── Phase 1 new scene types ───────────────────────────────────────────────
  | 'probe' // surfaces prior belief; routes past misconception_redirect
  | 'phenomenon_story' // cultural story + 3 character viewpoints; student picks side
  | 'hint_quiz' // quiz with 3 progressive pre-generated hints
  | 'misconception_redirect' // 60-sec micro-lesson; shown only if probe answer wrong
  | 'peer_teach' // student writes explanation; model explanation revealed after
  | 'mastery_moment' // celebration when full topic arc complete
  | 'retrieval_flash' // past-plan questions injected at session start (FSRS-driven)
  | 'outcomes_intro' // non-gated; numbered list of lesson objectives; always position 0
  | 'outcomes_check'; // gated; one real MCQ per objective; always final scene

export type FiveEStage =
  | 'Engage'
  | 'Explore'
  | 'Explain'
  | 'Apply'
  | 'Elaborate'
  | 'Evaluate';

export type BloomLevel =
  | 'remember'
  | 'understand'
  | 'apply'
  | 'analyse'
  | 'evaluate'
  | 'create';

// ── Slide ─────────────────────────────────────────────────────────────────────

export interface SlideContent {
  text: string;
  bullets?: string[];
  image_hint?: string; // optional suggestion for a diagram
}

// ── Quiz ─────────────────────────────────────────────────────────────────────

export interface QuizContent {
  question: string;
  options: string[];
  correct: number; // 0-based index
  explanation: string;
}

// ── Simulation ───────────────────────────────────────────────────────────────

export interface SimulationContent {
  simulation_html: string; // self-contained HTML ≤ 8 KB; sandbox enforced by frontend
  description: string;
}

// ── Whiteboard ────────────────────────────────────────────────────────────────

export interface WhiteboardContent {
  prompt: string; // what to show / compare on the whiteboard
  scaffolding?: string; // optional worked structure hint
}

// ── PBL stage ─────────────────────────────────────────────────────────────────

export interface PblStageContent {
  stage_name: string; // e.g., "Define the problem"
  challenge: string;
  guiding_questions: string[];
}

// ── Cornell Notes ─────────────────────────────────────────────────────────────
// Three-zone layout: notes column (pre-filled) | cue questions (left) | summary (bottom).
// Frontend renders as interactive: student writes their own cues + summary, which are saved.

export interface CornellNotesContent {
  notes_column: string; // main lesson content (pre-filled, 3-5 paragraphs)
  cue_questions: string[]; // 3-5 trigger questions for the left cue column
  summary: string; // 2-3 sentence synthesis for the bottom summary row
}

// ── Probe ──────────────────────────────────────────────────────────────────────
// Surfaces prior belief before instruction. Routes lesson past misconception_redirect
// if student answers correctly (handled by studio-shell frontend logic).

export interface ProbeContent {
  question: string;
  options: string[]; // 3-4 options
  correct: number; // 0-based index
  misconception_tag: string; // which misconception this probes for (from curriculum schema)
  brief_explanation: string; // shown after answer
  repeat_at_end?: boolean; // if true, same probe is shown post-lesson to measure belief shift
}

// ── Phenomenon Story ───────────────────────────────────────────────────────────

export interface PhenomenonStoryContent {
  story: string; // 5-8 sentences, local African context
  character_viewpoints: Array<{ character: string; claim: string }>; // 3 viewpoints
  correct_character: number; // 0-based index — which viewpoint is scientifically correct
  discussion_prompt: string; // "Which character do you agree with and why?"
  resolution: string; // explanation of the correct understanding, revealed after submit
}

// ── Hint Quiz ──────────────────────────────────────────────────────────────────

export interface HintQuizContent {
  question: string;
  options: string[];
  correct: number; // 0-based index
  explanation: string; // shown after answer
  hints: [string, string, string]; // 3 progressive hints, each nudging further
}

// ── Misconception Redirect ─────────────────────────────────────────────────────

export interface MisconceptionRedirectContent {
  misconception: string; // what the student believed
  why_it_makes_sense: string; // validates the student's logic — empathetic framing
  correct_understanding: string;
  analogy: string; // simple local analogy that fixes the mental model
}

// ── Peer Teach ─────────────────────────────────────────────────────────────────

export interface PeerTeachContent {
  prompt: string; // "Explain X to Tendo as if they are in S1"
  rubric_points: string[]; // 3-4 accuracy criteria shown after submission
  model_explanation: string; // revealed after student submits their own explanation
  min_words: number; // word count gate before submission (default: 30)
}

// ── Mastery Moment ─────────────────────────────────────────────────────────────

export interface MasteryMomentContent {
  topic: string;
  what_changed: string; // "You started thinking X, now you understand Y"
  key_insight: string; // one-sentence distillation of the core concept mastered
  share_text: string; // pre-written shareable certificate text
}

// ── Retrieval Flash ────────────────────────────────────────────────────────────
// Assembled by backend at session start from FSRS-due past plans; not generated by Gemini.

export interface RetrievalFlashQuestion {
  question: string;
  options: string[];
  correct: number;
  topic: string;
  plan_id: string;
  days_ago: number;
}

export interface RetrievalFlashContent {
  questions: RetrievalFlashQuestion[];
}

// ── Outcomes Intro ─────────────────────────────────────────────────────────────
// Non-gated; shows what this lesson will teach before any instruction begins.

export interface OutcomesIntroContent {
  topic: string;
  outcomes: string[]; // exact SoW learning_objectives text
  framing: string; // AI: 1-2 sentence hook connecting outcomes to real life
  curriculum_refs: string[]; // injected post-generation — parallel to outcomes[]
}

// ── Outcomes Check ─────────────────────────────────────────────────────────────
// Gated; one real 4-option MCQ per outcome; final scene.
// Graded client-side: selectedIndex === correct → achieved.

export interface OutcomesCheckItem {
  outcome: string; // exact SoW objective text (label shown above question)
  curriculum_ref: string; // injected post-generation
  question: string; // AI: specific question testing this outcome
  options: string[]; // exactly 4
  correct: number; // 0-based index; varied by AI (not always 0)
  explanation: string; // shown after answering — names the concept
}

export interface OutcomesCheckContent {
  topic: string;
  items: OutcomesCheckItem[];
}

// ── Union ─────────────────────────────────────────────────────────────────────

export type SceneContent =
  | SlideContent
  | QuizContent
  | SimulationContent
  | WhiteboardContent
  | PblStageContent
  | CornellNotesContent
  | ProbeContent
  | PhenomenonStoryContent
  | HintQuizContent
  | MisconceptionRedirectContent
  | PeerTeachContent
  | MasteryMomentContent
  | RetrievalFlashContent
  | OutcomesIntroContent
  | OutcomesCheckContent;

export interface Scene {
  type: SceneType;
  title: string;
  content: SceneContent;
  bloom_level: BloomLevel;
  five_e_stage?: FiveEStage;
  image_url?: string;
  image_key?: string; // R2 object key; used by startPlan() to refresh presigned image_url on each visit
  estimated_seconds: number;
  tts_script?: string; // populated by TTS pipeline
  audio_url?: string; // R2 WAV path
  // Probe routing: if true, this scene is hidden unless the preceding probe was answered incorrectly
  skip_if_probe_correct?: boolean;
}

// ── Student: upload provisional proof-of-class document (Safe Native Upload) ──
export async function uploadStudentDocument(
  formData: FormData,
): Promise<ServerActionResponse<any>> {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get('token')?.value
    const API = process.env.API_BASE_URL ?? process.env.NEXT_PUBLIC_API_URL ?? ''

    const headers: HeadersInit = {
      // We intentionally OMIT 'Content-Type' so the fetch API can 
      // automatically generate the multipart/form-data boundary.
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    }

    const res = await fetch(`${API}/api/v1/students/me/documents`, {
      method: 'POST',
      headers,
      body: formData,
    })

    if (!res.ok) {
      const err = await res.json().catch(() => ({ message: 'Upload failed' }))
      return { data: null, error: { message: err.message ?? 'Upload failed' } }
    }

    const data = await res.json()
    return { data, error: null }
  } catch (err: any) {
    return { data: null, error: { message: err.message ?? 'Upload failed' } }
  }
}

// ── Student: server-side AI evaluation of freeform text responses ───────────
export interface EvaluateResponsePayload {
  prompt: string
  student_answer: string
  rubric_points?: string[]
}

export interface EvaluateResponseResult {
  passed: boolean
  feedback: string
}

export async function evaluateStudentResponse(
  payload: EvaluateResponsePayload,
): Promise<ServerActionResponse<EvaluateResponseResult>> {
  return fetcher<EvaluateResponseResult>('/study-plans/evaluate-response', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}