'use client'

import { useState }                     from 'react'
import Link                             from 'next/link'
import { GraduationCap, FileEdit, Library, Sparkles, MessageSquare, ArrowRight, Search } from 'lucide-react'

import { Button }               from '@/components/ui/button'
import { ContactAdminDialog }   from '@/components/teacher/contact-admin-dialog'

interface Props {
  name:           string
  schoolName:     string
  organizationId: string
}

export function TeacherOnboardingState({ name, schoolName, organizationId }: Props) {
  const [contactOpen, setContactOpen] = useState(false)

  return (
    <>
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-8rem)] px-4 py-16">
        <div className="w-full max-w-2xl space-y-10">

          {/* ── Welcome header ── */}
          <div className="text-center space-y-3">
            <div className="flex justify-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gold/10 ring-1 ring-gold/20">
                <GraduationCap className="h-8 w-8 text-gold" />
              </div>
            </div>
            <div className="space-y-1">
              <h1 className="text-3xl font-bold tracking-tight">Welcome, {name}!</h1>
              <p className="text-muted-foreground">
                You&apos;re set up at <span className="font-medium text-foreground">{schoolName}</span>.
              </p>
            </div>
            <p className="text-sm text-muted-foreground max-w-sm mx-auto leading-relaxed">
              Your admin will assign you to classes — you&apos;ll get full access once that happens.
              In the meantime, you can browse available classes and request to be added.
            </p>
          </div>

          {/* ── Primary CTAs ── */}
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button asChild size="lg" className="gap-2">
              <Link href="/dashboard/teacher/classes?tab=browse">
                <Search className="h-4 w-4" />
                Browse &amp; Request Classes
              </Link>
            </Button>
            <Button
              variant="outline"
              size="lg"
              className="gap-2"
              onClick={() => setContactOpen(true)}
            >
              <MessageSquare className="h-4 w-4" />
              Contact Admin
            </Button>
          </div>

          {/* ── While you wait ── */}
          <div className="space-y-3">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground text-center">
              While you wait, explore
            </p>
            <div className="grid gap-3 sm:grid-cols-3">
              <Link
                href="/dashboard/exam-builder/new"
                className="group flex items-start gap-3 rounded-xl border border-border/60 bg-card p-4 hover:border-primary/30 hover:bg-muted/40 transition-all"
              >
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                  <FileEdit className="h-4 w-4 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">Exam Builder</p>
                  <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                    Draft AI-powered assessments ready to assign when classes arrive.
                  </p>
                </div>
                <ArrowRight className="h-4 w-4 text-muted-foreground/40 group-hover:text-muted-foreground mt-0.5 shrink-0 transition-colors" />
              </Link>

              <Link
                href="/dashboard/curricula"
                className="group flex items-start gap-3 rounded-xl border border-border/60 bg-card p-4 hover:border-primary/30 hover:bg-muted/40 transition-all"
              >
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                  <Library className="h-4 w-4 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">Curriculum Library</p>
                  <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                    Browse the national curriculum schemas for your subject area.
                  </p>
                </div>
                <ArrowRight className="h-4 w-4 text-muted-foreground/40 group-hover:text-muted-foreground mt-0.5 shrink-0 transition-colors" />
              </Link>

              <Link
                href="/dashboard/tracy"
                className="group flex items-start gap-3 rounded-xl border border-border/60 bg-card p-4 hover:border-primary/30 hover:bg-muted/40 transition-all"
              >
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gold/10">
                  <Sparkles className="h-4 w-4 text-gold" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">Ask Tracy</p>
                  <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                    Your AI teaching assistant — ask anything about your subject.
                  </p>
                </div>
                <ArrowRight className="h-4 w-4 text-muted-foreground/40 group-hover:text-muted-foreground mt-0.5 shrink-0 transition-colors" />
              </Link>
            </div>
          </div>

        </div>
      </div>

      <ContactAdminDialog
        open={contactOpen}
        onOpenChange={setContactOpen}
        organizationId={organizationId}
      />
    </>
  )
}
