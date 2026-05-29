// src/app/(dashboard)/dashboard/exam-builder/page.tsx
import Link from 'next/link'
import { FileText, Sparkles, ScrollText, ArrowRight, BookOpen, Clock, Zap } from 'lucide-react'

export default function ExamBuilderLandingPage() {
  return (
    <div className="min-h-[calc(100vh-4rem)] bg-gradient-to-br from-background via-background to-amber-500/5">
      <div className="max-w-5xl mx-auto px-6 py-12 space-y-12">

        {/* ── Header ──────────────────────────────────────────────────── */}
        <div className="space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 text-xs font-semibold tracking-wide uppercase">
            <Zap className="h-3 w-3" />
            Examination Centre
          </div>
          <h1 className="text-4xl font-bold tracking-tight text-foreground">
            Build Better Assessments
          </h1>
          <p className="text-lg text-muted-foreground max-w-xl">
            Create, manage, and grade assessments with AI assistance. Choose a workflow below to get started.
          </p>
        </div>

        {/* ── Primary workflow cards ───────────────────────────────────── */}
        <div className="grid md:grid-cols-3 gap-5">

          {/* My Assessments */}
          <Link href="/dashboard/exams">
            <div className="group relative h-full rounded-2xl border border-border bg-card p-6 hover:border-border/80 hover:shadow-lg transition-all duration-200 cursor-pointer overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="relative space-y-4">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400">
                  <FileText className="h-5 w-5" />
                </div>
                <div className="space-y-1.5">
                  <h2 className="text-base font-semibold text-card-foreground">My Assessments</h2>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    View, manage and grade your assessments with a marking guide.
                  </p>
                </div>
                <div className="flex items-center gap-1.5 text-sm font-medium text-blue-600 dark:text-blue-400 group-hover:gap-2.5 transition-all">
                  Open <ArrowRight className="h-3.5 w-3.5" />
                </div>
              </div>
            </div>
          </Link>

          {/* Exam Studio — featured */}
          <Link href="/dashboard/exam-builder/new">
            <div className="group relative h-full rounded-2xl border-2 border-amber-400/70 bg-gradient-to-br from-amber-500 to-orange-500 p-6 hover:shadow-xl hover:scale-[1.01] transition-all duration-200 cursor-pointer overflow-hidden">
              {/* Decorative circles */}
              <div className="absolute -top-6 -right-6 h-24 w-24 rounded-full bg-white/10" />
              <div className="absolute -bottom-4 -right-2 h-16 w-16 rounded-full bg-white/10" />

              <div className="relative space-y-4">
                <div className="flex items-start justify-between">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/20 text-white backdrop-blur-sm">
                    <Sparkles className="h-5 w-5" />
                  </div>
                  <span className="bg-white/20 backdrop-blur-sm text-white text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider">
                    Most Popular
                  </span>
                </div>
                <div className="space-y-1.5">
                  <h2 className="text-base font-semibold text-white">Exam Studio</h2>
                  <p className="text-sm text-amber-100 leading-relaxed">
                    Upload syllabus or notes — Mirror Intelligence builds your exam instantly.
                  </p>
                </div>
                <div className="flex items-center gap-1.5 text-sm font-medium text-white group-hover:gap-2.5 transition-all">
                  Get Started <ArrowRight className="h-3.5 w-3.5" />
                </div>
              </div>
            </div>
          </Link>

          {/* Marking Guide Studio */}
          <Link href="/dashboard/exam-builder/marking">
            <div className="group relative h-full rounded-2xl border border-border bg-card p-6 hover:border-border/80 hover:shadow-lg transition-all duration-200 cursor-pointer overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-orange-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="relative space-y-4">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-orange-500/10 text-orange-600 dark:text-orange-400">
                  <ScrollText className="h-5 w-5" />
                </div>
                <div className="space-y-1.5">
                  <h2 className="text-base font-semibold text-card-foreground">Marking Guide Studio</h2>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Generate detailed marking guides for existing papers or uploads.
                  </p>
                </div>
                <div className="flex items-center gap-1.5 text-sm font-medium text-orange-600 dark:text-orange-400 group-hover:gap-2.5 transition-all">
                  Open <ArrowRight className="h-3.5 w-3.5" />
                </div>
              </div>
            </div>
          </Link>
        </div>

        {/* ── How it works ─────────────────────────────────────────────── */}
        <div className="rounded-2xl border border-border bg-card/60 backdrop-blur-sm p-8 space-y-6">
          <div className="flex items-center gap-2">
            <BookOpen className="h-4 w-4 text-muted-foreground" />
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">How it works</h2>
          </div>

          <div className="grid sm:grid-cols-3 gap-6">
            {[
              {
                step: '01',
                title: 'Build your assessment',
                desc: 'Create structured questions or upload a PDF — AI extracts the marking guide automatically.',
                color: 'text-blue-600 dark:text-blue-400 bg-blue-500/10',
              },
              {
                step: '02',
                title: 'Assign to a class',
                desc: 'Publish the assessment to one or more classes. Students can then submit their work.',
                color: 'text-amber-600 dark:text-amber-400 bg-amber-500/10',
              },
              {
                step: '03',
                title: 'Grade & analyse',
                desc: 'Upload student scripts — Mirror Intelligence grades instantly and generates per-student analytics.',
                color: 'text-emerald-600 dark:text-emerald-400 bg-emerald-500/10',
              },
            ].map(({ step, title, desc, color }) => (
              <div key={step} className="space-y-3">
                <div className={`inline-flex h-8 w-8 items-center justify-center rounded-lg text-xs font-bold ${color}`}>
                  {step}
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-semibold text-card-foreground">{title}</p>
                  <p className="text-sm text-muted-foreground leading-relaxed">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── Quick stats strip ─────────────────────────────────────────── */}
        <div className="flex flex-wrap gap-6 px-1">
          {[
            { icon: <Clock className="h-4 w-4" />, label: 'Avg. grading time', value: '< 2 min' },
            { icon: <Zap className="h-4 w-4" />, label: 'AI accuracy', value: '97%+' },
            { icon: <FileText className="h-4 w-4" />, label: "Bloom's levels tracked", value: '6' },
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