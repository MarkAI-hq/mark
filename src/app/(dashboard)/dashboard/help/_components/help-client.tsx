'use client'

// src/app/(dashboard)/dashboard/help/_components/help-client.tsx

import { useState, ReactNode, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import {
  ChevronDown,
  Lightbulb,
  BookOpen,
  ArrowRight,
  Send,
  Loader2,
} from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { sendSupportEmail } from '@/lib/actions/support'

// ─────────────────────────────────────────────
// Routing helper — pushes to Tracy with ?q=
// ─────────────────────────────────────────────

function toTracy(router: ReturnType<typeof useRouter>, prompt: string) {
  router.push(`/dashboard/tracy?q=${encodeURIComponent(prompt)}`)
}

// ─────────────────────────────────────────────
// Loop stage card
// ─────────────────────────────────────────────

interface LoopCardProps {
  step:   string
  icon:   ReactNode
  color:  string
  title:  string
  desc:   string
  hint:   string
  prompt: string
}

function LoopCard({ step, icon, color, title, desc, hint, prompt }: LoopCardProps) {
  const router = useRouter()

  return (
    <button
      onClick={() => toTracy(router, prompt)}
      className="group relative h-full w-full text-left rounded-2xl border border-border bg-card p-5 hover:border-border/80 hover:shadow-md transition-all duration-200 overflow-hidden"
    >
      <div className="absolute inset-0 bg-gradient-to-br from-muted/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
      <div className="relative space-y-3">
        <div className="flex items-start justify-between">
          <div className={cn('flex h-10 w-10 items-center justify-center rounded-xl', color)}>
            {icon}
          </div>
          <span className="text-[10px] font-bold text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
            {step}
          </span>
        </div>
        <div className="space-y-1">
          <h3 className="text-sm font-semibold text-card-foreground">{title}</h3>
          <p className="text-xs text-muted-foreground leading-relaxed">{desc}</p>
        </div>
        <div className="flex items-center gap-1.5 pt-1 border-t border-border">
          <Lightbulb className="h-3 w-3 text-amber-500 shrink-0" />
          <span className="text-[11px] text-muted-foreground truncate">{hint}</span>
        </div>
      </div>
    </button>
  )
}

// ─────────────────────────────────────────────
// Tracy input bar
// ─────────────────────────────────────────────

function TracyInput() {
  const router = useRouter()
  const [query, setQuery] = useState('')

  const handleAsk = () => {
    const q = query.trim()
    if (!q) return
    toTracy(router, q)
  }

  return (
    <div className="flex gap-2">
      <Input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onKeyDown={(e) => { if (e.key === 'Enter') handleAsk() }}
        placeholder="E.g. Why is Birungi flagged at risk?"
        className="flex-1 h-10 text-sm"
      />
      <Button onClick={handleAsk} size="sm" className="h-10 px-4 gap-1.5">
        <Send className="h-3.5 w-3.5" />
        Ask Tracy
      </Button>
    </div>
  )
}

// ─────────────────────────────────────────────
// FAQ accordion item
// ─────────────────────────────────────────────

interface FaqItemProps {
  question: string
  answer:   string
}

function FaqItem({ question, answer }: FaqItemProps) {
  const [open, setOpen] = useState(false)

  return (
    <button
      onClick={() => setOpen((o) => !o)}
      className="w-full text-left px-5 py-4 hover:bg-muted/40 transition-colors"
    >
      <div className="flex items-center justify-between gap-3">
        <span className="text-sm font-medium text-card-foreground">{question}</span>
        <ChevronDown
          className={cn(
            'h-4 w-4 text-muted-foreground shrink-0 transition-transform duration-200',
            open && 'rotate-180',
          )}
        />
      </div>
      {open && (
        <p className="mt-2 text-sm text-muted-foreground leading-relaxed text-left">
          {answer}
        </p>
      )}
    </button>
  )
}

// ─────────────────────────────────────────────
// Contact form
// ─────────────────────────────────────────────

const TOPICS = [
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

function ContactForm() {
  const [isPending, startTransition] = useTransition()
  const [form, setForm] = useState({ name: '', email: '', topic: '', message: '' })

  const set = (k: keyof typeof form) => (v: string) =>
    setForm((f) => ({ ...f, [k]: v }))

  const handleSubmit = () => {
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
    <div className="rounded-2xl border border-border bg-card p-6 space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-muted-foreground">Your name</label>
          <Input
            value={form.name}
            onChange={(e) => set('name')(e.target.value)}
            placeholder="e.g. Tusii Ken"
            className="h-9 text-sm"
          />
        </div>
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-muted-foreground">Email</label>
          <Input
            type="email"
            value={form.email}
            onChange={(e) => set('email')(e.target.value)}
            placeholder="you@school.edu"
            className="h-9 text-sm"
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <label className="text-xs font-medium text-muted-foreground">Topic</label>
        <select
          value={form.topic}
          onChange={(e) => set('topic')(e.target.value)}
          className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
        >
          <option value="">Select a topic…</option>
          {TOPICS.map((t) => (
            <option key={t} value={t}>{t}</option>
          ))}
        </select>
      </div>

      <div className="space-y-1.5">
        <label className="text-xs font-medium text-muted-foreground">Message</label>
        <Textarea
          value={form.message}
          onChange={(e) => set('message')(e.target.value)}
          placeholder="Describe your issue or question…"
          className="text-sm min-h-[96px] resize-none"
        />
      </div>

      <Button
        onClick={handleSubmit}
        disabled={isPending}
        className="w-full h-9 gap-2"
      >
        {isPending ? (
          <><Loader2 className="h-3.5 w-3.5 animate-spin" /> Sending…</>
        ) : (
          <><Send className="h-3.5 w-3.5" /> Send message</>
        )}
      </Button>
    </div>
  )
}

// ─────────────────────────────────────────────
// Documentation row
// ─────────────────────────────────────────────

interface DocRowProps {
  title:      string
  desc:       string
  badge:      string
  badgeColor: string
  prompt:     string
}

function DocRow({ title, desc, badge, badgeColor, prompt }: DocRowProps) {
  const router = useRouter()

  return (
    <button
      onClick={() => toTracy(router, prompt)}
      className="group flex items-center gap-3 w-full text-left rounded-xl border border-border bg-card px-4 py-3 hover:border-border/80 hover:shadow-sm transition-all duration-150"
    >
      <BookOpen className="h-4 w-4 text-muted-foreground shrink-0" />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-card-foreground truncate">{title}</p>
        <p className="text-xs text-muted-foreground truncate">{desc}</p>
      </div>
      <span className={cn('text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0', badgeColor)}>
        {badge}
      </span>
      <ArrowRight className="h-3.5 w-3.5 text-muted-foreground shrink-0 group-hover:translate-x-0.5 transition-transform" />
    </button>
  )
}

// ─────────────────────────────────────────────
// Named export namespace
// ─────────────────────────────────────────────

export const HelpClient = {
  LoopCard,
  TracyInput,
  FaqItem,
  ContactForm,
  DocRow,
}