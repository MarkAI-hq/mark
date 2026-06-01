'use client'

// src/app/(dashboard)/dashboard/help/page.tsx

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import {
  HelpCircle, FileCheck, Sparkles, Brain, Target, TrendingUp,
  Compass, BookOpen, ArrowRight, ChevronDown, Lightbulb,
  Send, Loader2, PlayCircle, Zap,
} from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { sendSupportEmail } from '@/lib/actions/support'

// ── Types ────────────────────────────────────────────────────────────────────

interface LoopStage {
  key:    string
  step:   string
  icon:   React.ReactNode
  color:  string
  title:  string
  desc:   string
  hint:   string
  prompt: string
}

interface Doc {
  title:      string
  desc:       string
  badge:      string
  badgeColor: string
  prompt:     string
}

interface Faq {
  q: string
  a: string
}

// ── Data ─────────────────────────────────────────────────────────────────────

const LOOP_STAGES: LoopStage[] = [
  {
    key:    'quality-audit',
    step:   'Step 1',
    icon:   <FileCheck className="h-5 w-5" />,
    color:  'text-blue-600 dark:text-blue-400 bg-blue-500/10',
    title:  'Quality audit',
    desc:   'Schema-scoring, curriculum alignment, pass/fail.',
    hint:   'Assessment schema guide',
    prompt: 'How does the Mirror assessment quality audit work?',
  },
  {
    key:    'ai-grading',
    step:   'Step 2',
    icon:   <Sparkles className="h-5 w-5" />,
    color:  'text-purple-600 dark:text-purple-400 bg-purple-500/10',
    title:  'AI grading',
    desc:   'Uploading scripts, marking guide, overrides.',
    hint:   'Grading & marking guide',
    prompt: 'How does AI grading work and how do I upload scripts?',
  },
  {
    key:    'diagnosis',
    step:   'Step 3',
    icon:   <Brain className="h-5 w-5" />,
    color:  'text-rose-600 dark:text-rose-400 bg-rose-500/10',
    title:  'Diagnosis',
    desc:   "Error patterns, Bloom's levels, cognitive depth.",
    hint:   'Reading diagnostic reports',
    prompt: 'How do I read diagnosis and error pattern results in Mirror?',
  },
  {
    key:    'intervene',
    step:   'Step 4',
    icon:   <Target className="h-5 w-5" />,
    color:  'text-amber-600 dark:text-amber-400 bg-amber-500/10',
    title:  'Intervene',
    desc:   'At-risk flags, individual vs group actions.',
    hint:   'Intervention playbook',
    prompt: 'How do I intervene for at-risk students in Mirror?',
  },
  {
    key:    'impact',
    step:   'Step 5',
    icon:   <TrendingUp className="h-5 w-5" />,
    color:  'text-teal-600 dark:text-teal-400 bg-teal-500/10',
    title:  'Impact tracking',
    desc:   'Delta scores, continuous improvement loop.',
    hint:   'Impact & delta guide',
    prompt: 'How does impact tracking and delta measurement work in Mirror?',
  },
  {
    key:    'cognitive',
    step:   'LC',
    icon:   <Compass className="h-5 w-5" />,
    color:  'text-emerald-600 dark:text-emerald-400 bg-emerald-500/10',
    title:  'Cognitive profile',
    desc:   'Learning Compass, profile types, commitments.',
    hint:   'Learning Compass guide',
    prompt: 'How does the Learning Compass cognitive profile work?',
  },
]

const DOCS: Doc[] = [
  {
    title:      'Assessment schema & quality audit',
    desc:       'How Mirror scores and aligns your exam to curriculum',
    badge:      'Step 1',
    badgeColor: 'bg-blue-500/10 text-blue-700 dark:text-blue-300',
    prompt:     'Tell me about the Mirror assessment schema and quality audit process',
  },
  {
    title:      'AI grading & marking guide',
    desc:       'Uploading scripts, schema-enriched grading, overrides',
    badge:      'Step 2',
    badgeColor: 'bg-purple-500/10 text-purple-700 dark:text-purple-300',
    prompt:     'Tell me how AI grading and marking guides work in Mirror',
  },
  {
    title:      'Diagnosis & error patterns',
    desc:       'Precision, omission, terminological errors — root cause analysis',
    badge:      'Step 3',
    badgeColor: 'bg-rose-500/10 text-rose-700 dark:text-rose-300',
    prompt:     'Explain how diagnosis, error patterns and Blooms taxonomy work in Mirror',
  },
  {
    title:      'Intervention playbook',
    desc:       'Individual, group, and class-level actions for at-risk students',
    badge:      'Step 4',
    badgeColor: 'bg-amber-500/10 text-amber-700 dark:text-amber-300',
    prompt:     'How do I act on intervention recommendations in Mirror?',
  },
  {
    title:      'Impact tracking & delta scoring',
    desc:       'Reading improvement deltas, continuous loop',
    badge:      'Step 5',
    badgeColor: 'bg-teal-500/10 text-teal-700 dark:text-teal-300',
    prompt:     'How does impact tracking and delta measurement work in Mirror?',
  },
  {
    title:      'Learning Compass — cognitive profile',
    desc:       'Profile types, mental energy, learning strategy scores',
    badge:      'LC',
    badgeColor: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300',
    prompt:     'Explain the Learning Compass cognitive profile report in Mirror',
  },
  {
    title:      'Reports & guardian sign-off',
    desc:       'Printing, sharing, and guardian commitment forms',
    badge:      'Reports',
    badgeColor: 'bg-muted text-muted-foreground',
    prompt:     'How do I print and share student performance reports in Mirror?',
  },
  {
    title:      'Classes, students & organisation setup',
    desc:       'Enrolment, roles, inviting teachers, org settings',
    badge:      'Admin',
    badgeColor: 'bg-muted text-muted-foreground',
    prompt:     'How do I set up classes, enrol students and invite teachers in Mirror?',
  },
]

const FAQS: Faq[] = [
  {
    q: 'What triggers the "At Risk" flag?',
    a: 'A student is flagged At Risk when their average score falls below 50% across 2 or more assessments. The flag appears on the class view and the school dashboard.',
  },
  {
    q: 'What is a Precision Error?',
    a: "Precision Errors occur when a student's answer is on the right track but lacks specificity — missing exact terms, units, or qualifying detail required by the marking guide.",
  },
  {
    q: 'How does the quality audit pass/fail work?',
    a: 'Mirror scores your assessment against the curriculum schema. If alignment is below threshold, it fails and you are prompted to redesign with AI co-creation before grading unlocks.',
  },
  {
    q: 'Can I override an AI grade?',
    a: "Yes. Open any graded submission, click the score field, and enter your revised mark. The override is logged and the student's analytics update automatically.",
  },
  {
    q: 'What does the Learning Compass measure?',
    a: 'It measures two dimensions — Mental Energy (information processing and retention) and Learning Strategy (application and knowledge transfer). Together they produce a cognitive profile type such as "The Confident Navigator".',
  },
  {
    q: 'How do I print a student performance report?',
    a: 'Go to the student\'s profile page and click "Print Report". The PDF includes score history, Bloom\'s taxonomy breakdown, error patterns, and a guardian sign-off section.',
  },
]

const VIDEOS = [
  { title: 'Getting started',                duration: '3 min' },
  { title: 'Running the quality audit',      duration: '4 min' },
  { title: 'AI grading walkthrough',         duration: '5 min' },
  { title: 'Reading diagnosis results',      duration: '4 min' },
  { title: 'Intervening on at-risk students',duration: '3 min' },
  { title: 'Printing student reports',       duration: '2 min' },
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

function FaqItem({ q, a }: Faq) {
  const [open, setOpen] = useState(false)
  return (
    <button
      onClick={() => setOpen((o) => !o)}
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

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function HelpPage() {
  const router = useRouter()
  const [tracyQuery, setTracyQuery]     = useState('')
  const [openFaq, setOpenFaq]           = useState<number | null>(null)
  const [isPending, startTransition]    = useTransition()
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
            Browse guides by loop stage, watch tutorials, ask Tracy, or contact the team.
          </p>
        </div>

        {/* ── Loop stage cards ─────────────────────────────────── */}
        <div>
          <SectionLabel>Browse by loop stage</SectionLabel>
          <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4">
            {LOOP_STAGES.map((stage) => (
              <button
                key={stage.key}
                onClick={() => toTracy(stage.prompt)}
                className="group relative h-full w-full text-left rounded-2xl border border-border bg-card p-5 hover:border-border/80 hover:shadow-md transition-all duration-200 overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-muted/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="relative space-y-3">
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
              </button>
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

        {/* ── FAQ + Contact ─────────────────────────────────────── */}
        <div className="grid md:grid-cols-2 gap-6">

          {/* FAQ */}
          <div>
            <SectionLabel>Frequently asked questions</SectionLabel>
            <div className="rounded-2xl border border-border bg-card divide-y divide-border">
              {FAQS.map((faq, i) => (
                <button
                  key={faq.q}
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="w-full text-left px-5 py-4 hover:bg-muted/40 transition-colors"
                >
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-sm font-medium text-card-foreground">{faq.q}</span>
                    <ChevronDown
                      className={cn(
                        'h-4 w-4 text-muted-foreground shrink-0 transition-transform duration-200',
                        openFaq === i && 'rotate-180',
                      )}
                    />
                  </div>
                  {openFaq === i && (
                    <p className="mt-2 text-sm text-muted-foreground leading-relaxed text-left">
                      {faq.a}
                    </p>
                  )}
                </button>
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
            {DOCS.map((doc) => (
              <button
                key={doc.title}
                onClick={() => toTracy(doc.prompt)}
                className="group flex items-center gap-3 w-full text-left rounded-xl border border-border bg-card px-4 py-3 hover:border-border/80 hover:shadow-sm transition-all duration-150"
              >
                <BookOpen className="h-4 w-4 text-muted-foreground shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-card-foreground truncate">{doc.title}</p>
                  <p className="text-xs text-muted-foreground truncate">{doc.desc}</p>
                </div>
                <span className={cn('text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0', doc.badgeColor)}>
                  {doc.badge}
                </span>
                <ArrowRight className="h-3.5 w-3.5 text-muted-foreground shrink-0 group-hover:translate-x-0.5 transition-transform" />
              </button>
            ))}
          </div>
        </div>

        {/* ── Video tutorials ───────────────────────────────────── */}
        <div>
          <SectionLabel>Video tutorials</SectionLabel>
          <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4">
            {VIDEOS.map(({ title, duration }) => (
              <div
                key={title}
                className="group rounded-2xl border border-border bg-card overflow-hidden hover:border-border/80 hover:shadow-sm transition-all cursor-pointer"
              >
                <div className="h-20 bg-muted flex items-center justify-center">
                  <PlayCircle className="h-8 w-8 text-muted-foreground group-hover:text-foreground transition-colors" />
                </div>
                <div className="p-4 space-y-1">
                  <p className="text-sm font-medium text-card-foreground">{title}</p>
                  <p className="text-xs text-muted-foreground">{duration}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── Quick stats ───────────────────────────────────────── */}
        <div className="flex flex-wrap gap-6 px-1 border-t border-border pt-8">
          {[
            { icon: <Zap className="h-4 w-4" />,       label: 'AI grading accuracy', value: '97%+' },
            { icon: <TrendingUp className="h-4 w-4" />, label: 'Avg. grading time',   value: '< 2 min' },
            { icon: <Brain className="h-4 w-4" />,      label: "Bloom's levels",       value: '6 tracked' },
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