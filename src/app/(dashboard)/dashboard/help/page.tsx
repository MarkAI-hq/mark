'use client'

// src/app/(dashboard)/dashboard/help/page.tsx

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import {
  HelpCircle, FileCheck, Sparkles, Brain, Target, TrendingUp,
  Compass, BookOpen, ChevronDown, Lightbulb,
  Send, Loader2, PlayCircle, Zap, CheckCircle,
} from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { sendSupportEmail } from '@/lib/actions/support'

// ── Types ────────────────────────────────────────────────────────────────────

interface LoopStage {
  key:   string
  step:  string
  icon:  React.ReactNode
  color: string
  title: string
  desc:  string
  hint:  string
}

interface DocSection {
  heading: string
  body:    string
}

interface Doc {
  title:      string
  desc:       string
  badge:      string
  badgeColor: string
  content:    DocSection[]
}

interface Faq {
  q: string
  a: string
}

// ── Data ─────────────────────────────────────────────────────────────────────

const LOOP_STAGES: LoopStage[] = [
  {
    key:   'quality-audit',
    step:  'Step 1',
    icon:  <FileCheck className="h-5 w-5" />,
    color: 'text-blue-600 dark:text-blue-400 bg-blue-500/10',
    title: 'Quality audit',
    desc:  'Mirror audits your assessment against the curriculum schema before a single script is graded — checking topic coverage, Bloom’s distribution, command-word alignment, and mark allocation. Produces a pass, flag, or fail verdict with specific findings.',
    hint:  'Why did my assessment fail the quality audit?',
  },
  {
    key:   'ai-grading',
    step:  'Step 2',
    icon:  <Sparkles className="h-5 w-5" />,
    color: 'text-purple-600 dark:text-purple-400 bg-purple-500/10',
    title: 'AI grading',
    desc:  'Upload handwritten or digital scripts. Mirror enriches your marking guide with schema data and grades per-question with per-error annotations, justifications, and partial-credit reasoning. Override any AI mark with one click — every override is logged.',
    hint:  'Uploading scripts & reading AI grades',
  },
  {
    key:   'diagnosis',
    step:  'Step 3',
    icon:  <Brain className="h-5 w-5" />,
    color: 'text-rose-600 dark:text-rose-400 bg-rose-500/10',
    title: 'Diagnosis',
    desc:  'Every graded submission is mapped to Bloom’s six levels and classified into Precision, Omission, and Terminological error types. You see root-cause patterns across the class, not just scores.',
    hint:  'Reading error patterns & Bloom’s breakdown',
  },
  {
    key:   'intervene',
    step:  'Step 4',
    icon:  <Target className="h-5 w-5" />,
    color: 'text-amber-600 dark:text-amber-400 bg-amber-500/10',
    title: 'Intervene',
    desc:  'At-risk flags surface when a student’s average drops below 50% across two or more assessments. Generate AI-powered reteach sessions — Teacher Guide + printable Student Worksheet — in one click.',
    hint:  'Generating & delivering reteach sessions',
  },
  {
    key:   'impact',
    step:  'Step 5',
    icon:  <TrendingUp className="h-5 w-5" />,
    color: 'text-teal-600 dark:text-teal-400 bg-teal-500/10',
    title: 'Impact tracking',
    desc:  'After an intervention, Mirror auto-tracks improvement delta — the percentage-point change between baseline and follow-up. Longitudinal tracking shows whether your teaching changes are moving the class over time.',
    hint:  'Reading delta scores & trajectory graphs',
  },
  {
    key:   'cognitive',
    step:  'LC',
    icon:  <Compass className="h-5 w-5" />,
    color: 'text-emerald-600 dark:text-emerald-400 bg-emerald-500/10',
    title: 'Cognitive profile',
    desc:  'The Learning Compass scores every student on two axes — Mental Energy and Learning Strategy — producing a named cognitive profile type with 16 assignable learning tools and tailored commitments.',
    hint:  'Assigning learning tools from a profile',
  },
]

const DOCS: Doc[] = [
  {
    title:      'Assessment schema & quality audit',
    desc:       'How Mirror scores and aligns your exam to curriculum before grading',
    badge:      'Step 1',
    badgeColor: 'bg-blue-500/10 text-blue-700 dark:text-blue-300',
    content: [
      {
        heading: 'How it works',
        body:    'Before any script is graded, Mirror scores your assessment against the registered curriculum schema across four criteria: topic coverage (are the right subjects tested?), Bloom’s distribution (is the cognitive spread appropriate?), command-word alignment (do question verbs match expected Bloom’s levels?), and mark allocation (are marks proportional to curriculum weight?).',
      },
      {
        heading: 'Verdicts',
        body:    'The audit returns one of three verdicts. Pass — the assessment proceeds to grading. Flag — minor issues noted but grading proceeds with a warning. Fail — grading is locked until you address the findings. Fail reports list each criterion that failed and by how much.',
      },
      {
        heading: 'When it fails',
        body:    'Open the audit report and click “Redesign with AI”. Mirror generates specific question rewrites and redistribution suggestions. Accept, modify, or reject each one. Once the redesigned assessment passes, grading unlocks automatically.',
      },
      {
        heading: 'Tip',
        body:    'Run the quality audit before you distribute the physical exam — it takes seconds, and fixing schema issues before grading is far easier than after.',
      },
    ],
  },
  {
    title:      'AI grading & marking guide',
    desc:       'Uploading scripts, schema-enriched grading, partial credit, and overrides',
    badge:      'Step 2',
    badgeColor: 'bg-purple-500/10 text-purple-700 dark:text-purple-300',
    content: [
      {
        heading: 'Uploading scripts',
        body:    'Go to your assessment → Results → Upload Scripts. Mirror accepts PDF and image files (JPG, PNG) of handwritten scripts, or digital PDFs of typed responses. Upload individually or in bulk. Mirror automatically matches each script to a student using the name or ID written on the paper.',
      },
      {
        heading: 'How AI grades',
        body:    'Mirror combines your marking guide with the curriculum schema to grade each question independently. For each response it assigns a score, identifies the error type (Precision, Omission, or Terminological), and provides a justification. Partial credit is applied when a response satisfies some but not all mark criteria.',
      },
      {
        heading: 'Overriding a grade',
        body:    'Open any graded submission and click the score field to edit it. Enter your revised mark and optionally add a note. The override is logged with your name and a timestamp. The student’s analytics — error patterns, Bloom’s breakdown, national exam prediction — update immediately.',
      },
      {
        heading: 'Tip',
        body:    'Marking guide quality directly affects AI accuracy. Use the schema builder to add detailed mark descriptors — Mirror uses these to apply partial credit and detect edge cases the guide alone would miss.',
      },
    ],
  },
  {
    title:      'Diagnosis & error patterns',
    desc:       'Precision, omission, terminological errors — root cause analysis per student and class',
    badge:      'Step 3',
    badgeColor: 'bg-rose-500/10 text-rose-700 dark:text-rose-300',
    content: [
      {
        heading: 'Three error types',
        body:    'Precision Errors: the concept is present but the expression is imprecise — missing exact terms, units, or qualifying detail. Omission Errors: a required component is entirely absent — a step, clause, or measurement. Terminological Errors: the student used the wrong technical term — a colloquial substitute or near-synonym not accepted by the marking guide.',
      },
      {
        heading: 'Bloom’s taxonomy mapping',
        body:    'Each question and each student response is mapped to one of six Bloom’s levels: Remember, Understand, Apply, Analyse, Evaluate, Create. The diagnosis view shows whether a student’s weakness is at the knowledge level (1–3) or reasoning level (4–6), which determines the type of reteach needed.',
      },
      {
        heading: 'Reading the class view',
        body:    'The class diagnosis panel groups errors by type and by Bloom’s level. A large Omission cluster at the Apply level means students understand the concept but can’t apply it structurally — target procedural frameworks in your reteach. A Terminological cluster at the Remember level means vocabulary work comes first.',
      },
    ],
  },
  {
    title:      'Intervention playbook',
    desc:       'At-risk flags, reteach generation, individual and group actions',
    badge:      'Step 4',
    badgeColor: 'bg-amber-500/10 text-amber-700 dark:text-amber-300',
    content: [
      {
        heading: 'The At Risk flag',
        body:    'A student is automatically flagged At Risk when their average score drops below 50% across two or more assessments. The flag appears on the class dashboard, the student’s profile, and the school overview. You can also manually flag any student regardless of score.',
      },
      {
        heading: 'Generating a reteach session',
        body:    'Navigate to the at-risk student’s assessment result → click “Generate Reteach”. Mirror AI builds a lesson plan targeting the dominant error pattern. You can generate individual sessions (one student), group sessions (multiple students with the same error cluster), or a whole-class session.',
      },
      {
        heading: 'Delivery options',
        body:    'Digital: the reteach session appears on the student’s dashboard with instructions. Print: download a two-page PDF — Teacher Guide on page 1 (scripted explanation, example questions, expected misconceptions, success criteria, exit ticket), Student Worksheet on page 2 (practice questions and exit ticket).',
      },
      {
        heading: 'Closing the loop',
        body:    'After the reteach, enter exit ticket scores in the Impact tab. Mirror calculates the delta (improvement percentage), updates the student’s national exam prediction, and records the session in the longitudinal impact view.',
      },
    ],
  },
  {
    title:      'Impact tracking & delta scoring',
    desc:       'Reading improvement deltas, trajectory graphs, continuous loop',
    badge:      'Step 5',
    badgeColor: 'bg-teal-500/10 text-teal-700 dark:text-teal-300',
    content: [
      {
        heading: 'What delta measures',
        body:    'Delta is the percentage-point change in a student’s score between a baseline assessment and a follow-up after an intervention. A delta of +12 means the student improved by 12 percentage points. Delta is tracked per reteach session so you know exactly which interventions drove improvement.',
      },
      {
        heading: 'Where to find it',
        body:    'Open any assessment → Impact tab. You’ll see a per-student delta chart for everyone who received a reteach session. The class-level view shows aggregate delta — useful for evaluating whether your approach is working across the whole group.',
      },
      {
        heading: 'Longitudinal tracking',
        body:    'The Impact dashboard shows a student’s score trend across all assessments with intervention markers showing when reteach sessions occurred. An upward trajectory after an intervention confirms the strategy worked. A flat line despite intervention signals you need a different approach.',
      },
    ],
  },
  {
    title:      'Learning Compass — cognitive profile',
    desc:       'Profile types, mental energy, learning strategy scores, and tool assignment',
    badge:      'LC',
    badgeColor: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300',
    content: [
      {
        heading: 'Two axes',
        body:    'Mental Energy (0–100): how quickly and accurately a student processes and retains new information — derived from performance patterns across Bloom’s levels 1–3. Learning Strategy (0–100): how effectively a student applies and transfers knowledge — derived from Bloom’s levels 4–6.',
      },
      {
        heading: 'Profile types',
        body:    'The two scores produce one of nine named cognitive profiles — for example, “The Confident Navigator” (high Energy, high Strategy), “The Deep Thinker” (lower Energy, high Strategy), or “The Energetic Starter” (high Energy, lower Strategy). Each profile has a distinct set of recommended learning tools and study commitments.',
      },
      {
        heading: 'Assigning learning tools',
        body:    'Open a student’s Learning Compass report → Assign Tools. Mirror shows the 16 built-in tools filtered and ranked by effectiveness for the student’s profile. Assigned tools appear on the student’s study dashboard as daily commitments. Recommend 3–5 tools per student for best results.',
      },
    ],
  },
  {
    title:      'Reports & guardian sign-off',
    desc:       'Printing, sharing, and guardian commitment forms',
    badge:      'Reports',
    badgeColor: 'bg-muted text-muted-foreground',
    content: [
      {
        heading: 'What the report includes',
        body:    'A student performance report contains: score history across all assessments (graph + table), Bloom’s taxonomy breakdown (per-level performance), error pattern summary (Precision / Omission / Terminological proportions), national exam prediction (grade + confidence + trajectory), cognitive profile type, and a Guardian Sign-Off block.',
      },
      {
        heading: 'Printing and sharing',
        body:    'Go to the student’s profile → click “Print Report”. The PDF is generated immediately with all current data. You can download the PDF or share a secure link. The guardian does not need a Mirror account to view the shared link.',
      },
      {
        heading: 'Guardian sign-off',
        body:    'The sign-off block on the last page provides space for a parent or guardian to sign, date, and acknowledge the student’s performance and any intervention commitments. Signed copies can be scanned and uploaded to the student’s record in the portal.',
      },
    ],
  },
  {
    title:      'Classes, students & organisation setup',
    desc:       'Enrolment, roles, inviting teachers, org settings',
    badge:      'Admin',
    badgeColor: 'bg-muted text-muted-foreground',
    content: [
      {
        heading: 'Creating a class',
        body:    'Go to Classes → New Class. Enter the class name, select the subject and year level, and assign a teacher. You can create multiple classes per subject and assign the same teacher to multiple classes.',
      },
      {
        heading: 'Enrolling students',
        body:    'Add students individually (name + school ID) or import a CSV with columns: name, student_id, class_id. Mirror assigns a default PIN equal to the student’s ID. Customise PINs individually or in bulk via Admin → Students. Share the School Code and student portal link with your class.',
      },
      {
        heading: 'Inviting teachers',
        body:    'Go to Admin → Members → Invite Teacher. Enter the teacher’s work email. They receive an invitation link to set a password and join. Teachers only see classes assigned to them. Admins see all classes and all students across the organisation.',
      },
      {
        heading: 'Organisation settings',
        body:    'Admin → Organisation Settings lets you update your school name, logo, and contact details. The School Code shown here is what students use on the login screen — it never changes.',
      },
    ],
  },
  {
    title:      'National exam grade prediction',
    desc:       'How Mirror predicts students’ national exam grades — confidence, range, trajectory',
    badge:      'Predict',
    badgeColor: 'bg-violet-500/10 text-violet-700 dark:text-violet-300',
    content: [
      {
        heading: 'How it’s calculated',
        body:    'Mirror combines three signals: average score (mean across all graded assessments, weighted by recency), cognitive penalty (reduction based on Bloom’s-level coverage gaps — a student weak at Analyse-level questions will underperform on exam questions at that level), and topic penalty (reduction for curriculum topics with below-threshold mastery).',
      },
      {
        heading: 'Reading the prediction',
        body:    'The prediction shows: predicted score (e.g. 58%), predicted grade (e.g. Credit 4), score range (e.g. 52–64%), confidence level (High / Medium / Low), and a trajectory arrow (↑ improving / → stable / ↓ declining). Confidence is High when three or more assessments have been graded; Low with only one.',
      },
      {
        heading: 'Where to find it',
        body:    'The prediction appears on every student’s profile card, the class dashboard (as a grade distribution chart), and the school overview (aggregated by class). It updates automatically each time a new assessment is graded or a reteach delta is recorded.',
      },
      {
        heading: 'Using it with students',
        body:    'The prediction works best as a conversation starter — not a final verdict. Use the score range to set a realistic target zone, and the trajectory arrow to show whether current effort is moving them in the right direction.',
      },
    ],
  },
  {
    title:      'Reteach sessions — Teacher Guide & Student Worksheet',
    desc:       'Generating, delivering, and printing AI lesson plans for error remediation',
    badge:      'Reteach',
    badgeColor: 'bg-amber-500/10 text-amber-700 dark:text-amber-300',
    content: [
      {
        heading: 'Generating a reteach',
        body:    'Navigate to any assessment result → select an at-risk student or group → click “Generate Reteach”. Mirror analyses the dominant error pattern and builds a targeted lesson plan in 15–30 seconds. You can regenerate with a different error focus if the default isn’t right.',
      },
      {
        heading: 'Teacher Guide (page 1)',
        body:    'Contains: learning objective (tied to the curriculum outcome), scripted explanation (a clear explanation of the exact concept the student missed), example questions with model answers, a list of expected misconceptions and how to address each, success criteria (what “getting it” looks like), and a 3-question exit ticket.',
      },
      {
        heading: 'Student Worksheet (page 2)',
        body:    'Contains: a short concept summary in student-facing language, 5–8 practice questions at ascending Bloom’s levels, space for working, and the same 3-question exit ticket used to measure post-reteach performance for delta tracking.',
      },
      {
        heading: 'Recording results',
        body:    'After delivery, enter exit ticket scores in Impact → Reteach Sessions. Mirror calculates the delta and updates the student’s national exam prediction. For print delivery, collect signed worksheets and enter scores manually.',
      },
    ],
  },
  {
    title:      'Learning tools — 16 cognitive techniques',
    desc:       'Memory, retrieval, metacognitive, visual, Cornell, Zettelkasten, etymology tools',
    badge:      'Tools',
    badgeColor: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300',
    content: [
      {
        heading: 'The 16 tools by category',
        body:    'Memory: spaced repetition, interleaving, elaborative interrogation. Retrieval: free recall, cued recall, practice testing. Metacognitive: self-explanation, monitoring, error analysis. Visual: mind mapping, concept mapping, sketch-noting. Organizational: Cornell Notes, Zettelkasten card system. Note-Taking: etymology analysis, structured summarisation.',
      },
      {
        heading: 'Assigning tools to students',
        body:    'Go to a student’s Learning Compass report → Assign Tools. Mirror highlights the 3–5 tools most effective for the student’s cognitive profile type. Select tools and click Save — they appear on the student’s study dashboard immediately as daily commitments with step-by-step instructions.',
      },
      {
        heading: 'Admin management',
        body:    'Admins can view, edit, and create tools at Admin → Learning Tools. Each tool has a name, description, category, and step-by-step instructions shown to students. Tools can be activated or deactivated school-wide.',
      },
    ],
  },
  {
    title:      'Student enrollment — school code & PIN',
    desc:       'How students join Mirror: school code, student ID, and PIN-based login',
    badge:      'Students',
    badgeColor: 'bg-muted text-muted-foreground',
    content: [
      {
        heading: 'How students log in',
        body:    'Students log in at /student/login (share this link with your class). The login screen has three fields: School Code (your school’s unique identifier — never changes), Student ID (the ID assigned when you enrolled them), and PIN (a 4–10 digit number set by Admin).',
      },
      {
        heading: 'Setting up accounts',
        body:    'When you enrol a student or import via CSV, Mirror auto-generates a default PIN equal to the student’s ID. Change any PIN at Admin → Students → [Student Name] → Edit. For bulk PIN changes, export the student list, update the PIN column, and re-import.',
      },
      {
        heading: 'Finding your school code',
        body:    'Go to Admin → Organisation Settings. The School Code is shown at the top of the page. Print it on student registration forms or handouts — students are prompted to change their default PIN on first login.',
      },
    ],
  },
  {
    title:      'Curricula builder — guided create & AI fill',
    desc:       'Creating, versioning, and AI-filling curriculum schemas from PDF or DOCX',
    badge:      'Curricula',
    badgeColor: 'bg-blue-500/10 text-blue-700 dark:text-blue-300',
    content: [
      {
        heading: 'Creating from scratch',
        body:    'Go to Admin → Curricula → New Schema. The guided builder walks you through: subject and year level, topic list, learning outcomes per topic, Bloom’s weight distribution per topic (what percentage of questions at each level), and error type definitions typical for the subject.',
      },
      {
        heading: 'AI fill from document',
        body:    'Click “AI Fill” and upload your official curriculum document (PDF or DOCX). Mirror extracts topics, outcomes, and Bloom’s weighting automatically — takes 30–60 seconds. Review the extracted schema in the editor and correct any misreads before saving.',
      },
      {
        heading: 'Versioning',
        body:    'Every saved schema is versioned. Drafts can be edited freely. Activating a version makes it the default for new assessments — previous versions are preserved and still drive any assessments created against them. Roll back by activating an older version.',
      },
      {
        heading: 'Schema library',
        body:    'Org Admins manage their own schemas. The Root-managed shared library contains nationally-standardised schemas (e.g. Uganda National Curriculum Biology S4) that any org can use as a base and customise.',
      },
    ],
  },
  {
    title:      'Subscription plans & limits',
    desc:       'Starter vs Pro vs Enterprise — grading quotas, watermarks, student caps',
    badge:      'Billing',
    badgeColor: 'bg-muted text-muted-foreground',
    content: [
      {
        heading: 'Plan tiers',
        body:    'Starter (Free): up to 30 active students, 3 AI grading runs per month, Mirror watermark on reports, no bulk export. Pro: unlimited students, unlimited AI grading, watermark-free reports, bulk PDF export, advanced analytics and longitudinal tracking. Enterprise: everything in Pro plus multi-school management, custom branding, dedicated account manager, and SLA support.',
      },
      {
        heading: 'How limits are enforced',
        body:    'Grading limits are checked when you submit scripts. At 80% of your monthly limit, a warning banner appears. At 100%, grading is blocked until the next billing cycle or you upgrade. Student limits are checked on enrolment — you’ll be prompted to upgrade before the new student is saved.',
      },
      {
        heading: 'Upgrading',
        body:    'Go to Admin → Billing → Upgrade Plan. Upgrades apply immediately. Downgrades take effect at the next billing cycle. Annual plans are available at a discount.',
      },
      {
        heading: 'Tip',
        body:    'Watermarked reports are functionally identical to Pro reports — only the Mirror branding in the footer differs. The Starter plan gives full access to all features for pilot classes of 30 or fewer students.',
      },
    ],
  },
]

const FAQS: Faq[] = [
  {
    q: 'What triggers the “At Risk” flag?',
    a: 'A student is flagged At Risk when their average score falls below 50% across 2 or more assessments. The flag appears on the class view and the school dashboard.',
  },
  {
    q: 'What is a Precision Error?',
    a: 'Precision Errors occur when a student’s answer is on the right track but lacks specificity — missing exact terms, units, or qualifying detail required by the marking guide.',
  },
  {
    q: 'How does the quality audit pass/fail work?',
    a: 'Mirror scores your assessment against the curriculum schema. If alignment is below threshold, it fails and you are prompted to redesign with AI co-creation before grading unlocks.',
  },
  {
    q: 'Can I override an AI grade?',
    a: 'Yes. Open any graded submission, click the score field, and enter your revised mark. The override is logged and the student’s analytics update automatically.',
  },
  {
    q: 'What does the Learning Compass measure?',
    a: 'It measures two dimensions — Mental Energy (information processing and retention) and Learning Strategy (application and knowledge transfer). Together they produce a cognitive profile type such as “The Confident Navigator”.',
  },
  {
    q: 'How do I print a student performance report?',
    a: 'Go to the student’s profile page and click “Print Report”. The PDF includes score history, Bloom’s taxonomy breakdown, error patterns, and a guardian sign-off section.',
  },
  {
    q: 'How does the national exam grade prediction work?',
    a: 'Mirror combines a student’s average score with a cognitive penalty (Bloom’s-level gaps) and a topic penalty (curriculum weight vs. mastery) to produce a predicted score, grade, range, and confidence level. Visible on each student’s profile and the teacher dashboard.',
  },
  {
    q: 'What is a Reteach session?',
    a: 'A Reteach session is an AI-generated lesson plan produced from a detected error pattern. It includes a Teacher Guide (scripted explanation, example questions, expected misconceptions, success criteria, exit ticket) and a Student Worksheet (practice questions). Both can be delivered digitally or printed.',
  },
  {
    q: 'What is an Omission Error?',
    a: 'An Omission Error means the student’s answer left out a required component — a step, a qualifying clause, or a required unit. The reteach focus is on completeness and structured response frameworks.',
  },
  {
    q: 'What is a Terminological Error?',
    a: 'A Terminological Error means the student used the wrong technical term — often a near-synonym or colloquial substitute not accepted by the marking guide.',
  },
  {
    q: 'How do students log in to Mirror?',
    a: 'Students do not use email. They log in with three fields: School Code (visible in Admin → Organisation Settings), Student ID (their school-assigned ID), and a PIN (4–10 digits set by Admin).',
  },
  {
    q: 'What is a Delta Score?',
    a: 'Delta is the percentage-point change in a student’s score between a baseline assessment and a follow-up after intervention. Positive delta means improvement. Mirror tracks delta per reteach session.',
  },
  {
    q: 'Who can do what — what do the roles mean?',
    a: 'Root (Mirror team — platform-wide), Support (Mirror support agents), Admin (manages teachers, students, classes, billing), Teacher (grades, generates reteach sessions, reads analytics), Reviewer (read-only grading access), Student (own dashboard, study plan, cognitive profile).',
  },
  {
    q: 'How does Guardian sign-off work?',
    a: 'When a student report is printed, it includes a Guardian Sign-Off block where a parent or guardian signs to acknowledge performance and intervention commitments. No guardian account is required.',
  },
  {
    q: 'What are the subscription plan limits?',
    a: 'Starter: up to 30 students, 3 AI gradings/month, watermarked reports. Pro: unlimited students, unlimited grading, no watermarks, bulk PDF export. Enterprise: multi-school support and a dedicated account manager.',
  },
  {
    q: 'How do I build or import a curriculum schema?',
    a: 'Go to Admin → Curricula. Create from scratch using the guided builder, or upload a PDF or DOCX and let Mirror AI-fill the schema. Schemas are versioned — draft, review, activate. Root manages the shared national schema library.',
  },
]

const VIDEOS = [
  { title: 'Getting started'                  },
  { title: 'Running the quality audit'        },
  { title: 'AI grading walkthrough'           },
  { title: 'Reading diagnosis results'        },
  { title: 'Intervening on at-risk students'  },
  { title: 'Printing student reports'         },
]

const SUPPORT_TOPICS = [
  'Quality audit',
  'AI grading',
  'Diagnosis & error patterns',
  'Intervention',
  'Impact tracking',
  'Cognitive profile / Learning Compass',
  'Reports & printing',
  'Classes & students',
  'Account & billing',
  'Technical issue',
  'Other',
]

// ── Sub-components ────────────────────────────────────────────────────────────

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-4">
      {children}
    </p>
  )
}

function FaqItem({ q, a, open, onToggle }: Faq & { open: boolean; onToggle: () => void }) {
  return (
    <button
      onClick={onToggle}
      className="w-full text-left px-5 py-4 hover:bg-muted/40 transition-colors"
    >
      <div className="flex items-center justify-between gap-3">
        <span className="text-sm font-medium text-card-foreground">{q}</span>
        <ChevronDown
          className={cn(
            'h-4 w-4 text-muted-foreground shrink-0 transition-transform duration-200',
            open && 'rotate-180',
          )}
        />
      </div>
      {open && (
        <p className="mt-2 text-sm text-muted-foreground leading-relaxed text-left">{a}</p>
      )}
    </button>
  )
}

function DocAccordion({
  title, desc, badge, badgeColor, content, open, onToggle,
}: Doc & { open: boolean; onToggle: () => void }) {
  return (
    <div className={cn(
      'rounded-xl border bg-card transition-colors duration-150',
      open ? 'border-border' : 'border-border hover:border-border/80',
    )}>
      <button
        onClick={onToggle}
        className="group flex items-center gap-3 w-full text-left px-4 py-3 hover:bg-muted/30 transition-colors rounded-xl"
      >
        <BookOpen className="h-4 w-4 text-muted-foreground shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-card-foreground truncate">{title}</p>
          <p className="text-xs text-muted-foreground truncate">{desc}</p>
        </div>
        <span className={cn('text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0', badgeColor)}>
          {badge}
        </span>
        <ChevronDown
          className={cn(
            'h-3.5 w-3.5 text-muted-foreground shrink-0 transition-transform duration-200',
            open && 'rotate-180',
          )}
        />
      </button>

      {open && (
        <div className="px-4 pb-5 pt-1 border-t border-border space-y-4">
          {content.map(({ heading, body }) => (
            <div key={heading} className="space-y-1.5">
              <p className="text-[11px] font-semibold text-foreground uppercase tracking-wide">
                {heading}
              </p>
              <p className="text-sm text-muted-foreground leading-relaxed">{body}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function HelpPage() {
  const router = useRouter()
  const [tracyQuery, setTracyQuery]  = useState('')
  const [openFaq, setOpenFaq]        = useState<number | null>(null)
  const [openDoc, setOpenDoc]        = useState<number | null>(null)
  const [isPending, startTransition] = useTransition()
  const [form, setForm] = useState({ name: '', email: '', topic: '', message: '' })

  const setField = (k: keyof typeof form) => (v: string) =>
    setForm((f) => ({ ...f, [k]: v }))

  const toTracy = (prompt: string) =>
    router.push(`/dashboard/tracy?q=${encodeURIComponent(prompt)}`)

  const handleTracy = () => {
    const q = tracyQuery.trim()
    if (!q) return
    toTracy(q)
  }

  const handleContact = () => {
    if (!form.name || !form.email || !form.topic || !form.message) {
      toast.error('Please fill in all fields.')
      return
    }
    startTransition(async () => {
      const result = await sendSupportEmail(form)
      if (result.error) {
        toast.error('Failed to send message', { description: result.error.message })
        return
      }
      toast.success('Message sent!', { description: 'Our team will get back to you within 24 hours.' })
      setForm({ name: '', email: '', topic: '', message: '' })
    })
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-gradient-to-br from-background via-background to-gold/3">
      <div className="max-w-5xl mx-auto px-6 py-12 space-y-14">

        {/* ── Header ───────────────────────────────────────────── */}
        <div className="space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gold/10 text-gold text-xs font-semibold tracking-wide uppercase">
            <HelpCircle className="h-3 w-3" />
            Help Centre
          </div>
          <h1 className="text-4xl font-bold tracking-tight text-foreground">
            How can we help you?
          </h1>
          <p className="text-lg text-muted-foreground max-w-xl">
            Browse guides by loop stage, read documentation inline, ask Tracy, or contact the team.
          </p>
        </div>

        {/* ── Loop stage cards ─────────────────────────────────── */}
        <div>
          <SectionLabel>Browse by loop stage</SectionLabel>
          <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4">
            {LOOP_STAGES.map((stage) => (
              <div
                key={stage.key}
                className="relative h-full w-full rounded-2xl border border-border bg-card p-5 overflow-hidden"
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between">
                    <div className={cn('flex h-10 w-10 items-center justify-center rounded-xl', stage.color)}>
                      {stage.icon}
                    </div>
                    <span className="text-[10px] font-bold text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                      {stage.step}
                    </span>
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-sm font-semibold text-card-foreground">{stage.title}</h3>
                    <p className="text-xs text-muted-foreground leading-relaxed">{stage.desc}</p>
                  </div>
                  <div className="flex items-center gap-1.5 pt-1 border-t border-border">
                    <Lightbulb className="h-3 w-3 text-amber-500 shrink-0" />
                    <span className="text-[11px] text-muted-foreground truncate">{stage.hint}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── Tracy AI ─────────────────────────────────────────── */}
        <div className="rounded-2xl glass p-6 space-y-4">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-gold" />
            <SectionLabel>Ask Tracy — AI assistant</SectionLabel>
          </div>
          <div className="flex items-start gap-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gold/10 text-gold">
              <Sparkles className="h-4 w-4" />
            </div>
            <div className="rounded-xl border border-border bg-background px-4 py-3 text-sm text-muted-foreground leading-relaxed">
              Hi, I&apos;m Tracy. Ask me anything about the Mirror loop — grading, diagnosis,
              intervention, reports, or your account.
            </div>
          </div>
          <div className="flex gap-2">
            <Input
              value={tracyQuery}
              onChange={(e) => setTracyQuery(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') handleTracy() }}
              placeholder="E.g. Why is Birungi flagged at risk?"
              className="flex-1 h-10 text-sm"
            />
            <Button variant="gold" onClick={handleTracy} size="sm" className="h-10 px-4 gap-1.5">
              <Send className="h-3.5 w-3.5" />
              Ask Tracy
            </Button>
          </div>
        </div>

        {/* ── Getting started ───────────────────────────────────── */}
        <div>
          <SectionLabel>Getting started</SectionLabel>
          <div className="grid sm:grid-cols-3 gap-4">
            {[
              {
                step:  '1',
                title: 'Set up your organisation',
                body:  'Create your school in Admin → Organisation Settings. Copy your School Code — students will need it to log in. Invite teachers by email.',
                color: 'text-blue-600 dark:text-blue-400',
                bg:    'bg-blue-500/10',
                role:  'Admin task',
              },
              {
                step:  '2',
                title: 'Create a class & enrol students',
                body:  'Go to Classes → New Class. Add students manually or import via CSV. Assign PINs and share the student login link with your class.',
                color: 'text-purple-600 dark:text-purple-400',
                bg:    'bg-purple-500/10',
                role:  'Admin or Teacher task',
              },
              {
                step:  '3',
                title: 'Run your first assessment',
                body:  'Create an assessment under Exam Builder. Mirror quality-audits it automatically. Upload student scripts — results, error patterns, and at-risk flags appear within minutes.',
                color: 'text-teal-600 dark:text-teal-400',
                bg:    'bg-teal-500/10',
                role:  'Teacher task',
              },
            ].map(({ step, title, body, color, bg, role }) => (
              <div key={step} className="rounded-2xl border border-border bg-card p-5 space-y-3">
                <div className={cn('flex h-9 w-9 items-center justify-center rounded-xl text-sm font-bold', bg, color)}>
                  {step}
                </div>
                <div className="space-y-1.5">
                  <p className="text-sm font-semibold text-card-foreground">{title}</p>
                  <p className="text-xs text-muted-foreground leading-relaxed">{body}</p>
                </div>
                <div className="flex items-center gap-1.5 pt-1 border-t border-border">
                  <CheckCircle className={cn('h-3 w-3 shrink-0', color)} />
                  <span className="text-[11px] text-muted-foreground">{role}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── FAQ + Contact ─────────────────────────────────────── */}
        <div className="grid md:grid-cols-2 gap-6">

          {/* FAQ */}
          <div>
            <SectionLabel>Frequently asked questions</SectionLabel>
            <div className="rounded-2xl border border-border bg-card divide-y divide-border">
              {FAQS.map((faq, i) => (
                <FaqItem
                  key={faq.q}
                  {...faq}
                  open={openFaq === i}
                  onToggle={() => setOpenFaq(openFaq === i ? null : i)}
                />
              ))}
            </div>
          </div>

          {/* Contact */}
          <div>
            <SectionLabel>Contact support</SectionLabel>
            <div className="rounded-2xl border border-border bg-card p-6 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground">Your name</label>
                  <Input
                    value={form.name}
                    onChange={(e) => setField('name')(e.target.value)}
                    placeholder="e.g. Tusii Ken"
                    className="h-9 text-sm"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground">Email</label>
                  <Input
                    type="email"
                    value={form.email}
                    onChange={(e) => setField('email')(e.target.value)}
                    placeholder="you@school.edu"
                    className="h-9 text-sm"
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">Topic</label>
                <select
                  value={form.topic}
                  onChange={(e) => setField('topic')(e.target.value)}
                  className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                >
                  <option value="">Select a topic…</option>
                  {SUPPORT_TOPICS.map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">Message</label>
                <Textarea
                  value={form.message}
                  onChange={(e) => setField('message')(e.target.value)}
                  placeholder="Describe your issue or question…"
                  className="text-sm min-h-[96px] resize-none"
                />
              </div>
              <Button
                onClick={handleContact}
                disabled={isPending}
                className="w-full h-9 gap-2"
              >
                {isPending
                  ? <><Loader2 className="h-3.5 w-3.5 animate-spin" /> Sending…</>
                  : <><Send className="h-3.5 w-3.5" /> Send message</>
                }
              </Button>
            </div>
          </div>
        </div>

        {/* ── Documentation ─────────────────────────────────────── */}
        <div>
          <SectionLabel>Documentation</SectionLabel>
          <div className="flex flex-col gap-2">
            {DOCS.map((doc, i) => (
              <DocAccordion
                key={doc.title}
                {...doc}
                open={openDoc === i}
                onToggle={() => setOpenDoc(openDoc === i ? null : i)}
              />
            ))}
          </div>
        </div>

        {/* ── Key terms ─────────────────────────────────────────── */}
        <div>
          <SectionLabel>Key terms</SectionLabel>
          <div className="grid sm:grid-cols-2 gap-3">
            {[
              {
                term: 'Mirror Loop',
                def:  'The five-step teaching cycle Mirror runs around every assessment: Quality Audit → AI Grading → Diagnosis → Intervene → Impact Tracking.',
              },
              {
                term: 'At Risk',
                def:  'A flag automatically applied when a student’s average score falls below 50% across two or more graded assessments.',
              },
              {
                term: 'Precision Error',
                def:  'The student understood the concept but expressed it inaccurately — missing exact terms, units, or qualifying detail required by the marking guide.',
              },
              {
                term: 'Omission Error',
                def:  'The student left out a required component of the answer — a step, clause, or required unit. Focus: structural completeness.',
              },
              {
                term: 'Terminological Error',
                def:  'The student used the wrong technical term — often a colloquial substitute or near-synonym not accepted by the marking guide.',
              },
              {
                term: 'Delta Score',
                def:  'The percentage-point change in a student’s score between a baseline submission and a follow-up after intervention. Positive delta = improvement.',
              },
              {
                term: 'Bloom’s Level',
                def:  'One of six cognitive complexity levels (Remember, Understand, Apply, Analyse, Evaluate, Create). Mirror maps every question and error to a level.',
              },
              {
                term: 'Learning Compass',
                def:  'Mirror’s cognitive profiling tool. Scores two dimensions — Mental Energy and Learning Strategy — to produce a named profile type with tailored learning commitments.',
              },
              {
                term: 'Reteach Session',
                def:  'An AI-generated lesson plan from a detected error pattern. Contains a Teacher Guide (scripted explanation, example questions, exit ticket) and a Student Worksheet (practice questions).',
              },
              {
                term: 'Quality Audit',
                def:  'Mirror’s pre-grading check of an assessment against the curriculum schema. Scores topic coverage, Bloom’s distribution, command-word alignment, and mark allocation.',
              },
            ].map(({ term, def }) => (
              <div key={term} className="rounded-xl border border-border bg-card px-4 py-3 space-y-1">
                <p className="text-sm font-semibold text-card-foreground">{term}</p>
                <p className="text-xs text-muted-foreground leading-relaxed">{def}</p>
              </div>
            ))}
          </div>
        </div>

        {/* ── Video tutorials ───────────────────────────────────── */}
        <div>
          <SectionLabel>Video tutorials</SectionLabel>
          <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4">
            {VIDEOS.map(({ title }) => (
              <div key={title} className="rounded-2xl border border-border bg-card overflow-hidden">
                <div className="h-20 bg-muted flex items-center justify-center">
                  <PlayCircle className="h-8 w-8 text-muted-foreground/40" />
                </div>
                <div className="p-4 space-y-1">
                  <p className="text-sm font-medium text-card-foreground">{title}</p>
                  <p className="text-xs text-muted-foreground/60 italic">Coming soon</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── Quick stats ───────────────────────────────────────── */}
        <div className="flex flex-wrap gap-6 px-1 border-t border-border pt-8">
          {[
            { icon: <Zap className="h-4 w-4" />,         label: 'AI grading accuracy',     value: '97%+'       },
            { icon: <TrendingUp className="h-4 w-4" />,   label: 'Avg. grading time',       value: '< 2 min'    },
            { icon: <Brain className="h-4 w-4" />,        label: 'Bloom’s levels tracked', value: '6 levels'   },
            { icon: <Target className="h-4 w-4" />,       label: 'Teaching loop steps',     value: '5 steps'    },
            { icon: <BookOpen className="h-4 w-4" />,     label: 'Built-in learning tools', value: '16 tools'   },
          ].map(({ icon, label, value }) => (
            <div key={label} className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                {icon}
              </div>
              <div>
                <p className="text-xs text-muted-foreground">{label}</p>
                <p className="text-sm font-bold text-foreground">{value}</p>
              </div>
            </div>
          ))}
        </div>

      </div>
    </div>
  )
}
