// src/app/student/login/page.tsx
import { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { Sparkles, BookOpen, Star, Trophy, ArrowLeft } from 'lucide-react'
import { StudentLoginForm } from '@/components/auth/students-login-form'

export const metadata: Metadata = {
  title:       'Student Login — Mirror Intelligence',
  description: 'Sign in to your student portal',
}

const HIGHLIGHTS = [
  {
    icon:  BookOpen,
    title: 'Your learning, your pace',
    desc:  'Access your assignments, feedback, and progress all in one place.',
  },
  {
    icon:  Star,
    title: 'Personalised feedback',
    desc:  'See exactly where you excelled and where to improve.',
  },
  {
    icon:  Trophy,
    title: 'Track your growth',
    desc:  'Watch your skills develop across every subject over time.',
  },
]

export default function StudentLoginPage() {
  return (
    <div className="h-screen overflow-hidden grid lg:grid-cols-2">

      {/* ── Left panel ──────────────────────────────────────────────── */}
      <div className="hidden lg:flex flex-col relative overflow-hidden bg-[#0D0B08] px-12 py-10 text-white">

        {/* Film grain */}
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.04] mix-blend-overlay"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
            backgroundRepeat: 'repeat',
            backgroundSize: '256px 256px',
          }}
        />
        {/* Gold atmospheric glows */}
        <div className="pointer-events-none absolute left-1/3 top-1/4 -translate-x-1/2 -translate-y-1/2 h-[500px] w-[700px] rounded-full bg-[#926C15]/18 blur-[130px]" />
        <div className="pointer-events-none absolute right-0 bottom-1/3 h-[300px] w-[400px] rounded-full bg-[#926C15]/10 blur-[100px]" />

        {/* Logo + Body grouped */}
        <div className="relative z-10 space-y-8">
          <Link href="/">
            <Image
              src="/assets/images/markBlackBg.png"
              alt="Mirror Intelligence"
              width={160}
              height={80}
              className="rounded-lg"
            />
          </Link>

          <div className="space-y-7">

            {/* Badge */}
            <div className="inline-flex items-center gap-2 rounded-full border border-[#926C15]/40 bg-[#926C15]/10 px-4 py-1.5 text-sm w-fit">
              <Sparkles className="h-3.5 w-3.5 text-[#926C15]" />
              <span className="font-semibold text-[#926C15]">Mirror</span>
              <span className="text-white/30">·</span>
              <span className="text-white/60 font-medium">Student Portal</span>
            </div>

            <div className="space-y-2.5">
              <h1 className="text-3xl font-black leading-tight tracking-tighter">
                Your learning journey{' '}
                <span className="bg-gradient-to-br from-[#926C15] via-[#C09020] to-[#D4AA30] bg-clip-text text-transparent">
                  continues here.
                </span>
              </h1>
              <p className="text-white/50 text-base leading-relaxed max-w-sm">
                Sign in with your student card details to pick up right where you left off.
              </p>
            </div>

            <div className="space-y-4">
              {HIGHLIGHTS.map(({ icon: Icon, title, desc }) => (
                <div key={title} className="flex items-start gap-3">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#926C15]/15 border border-[#926C15]/25">
                    <Icon className="h-3.5 w-3.5 text-[#926C15]" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold">{title}</p>
                    <p className="text-xs text-white/45 mt-0.5 leading-relaxed">{desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <p className="relative z-10 mt-auto pt-10 text-xs text-white/30">
          © {new Date().getFullYear()} Mirror Intelligence. All rights reserved.
        </p>
      </div>

      {/* ── Right panel — form ───────────────────────────────────────── */}
      <div className="relative flex flex-col items-center justify-center h-full px-6 py-12 sm:px-10 bg-background">

        {/* Top navigation */}
        <div className="absolute top-6 left-6 right-6 flex items-center justify-between">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-[#926C15] transition-colors"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Back to home
          </Link>
          <p className="text-sm text-muted-foreground">
            New here?{' '}
            <Link href="/schools" className="font-semibold text-[#926C15] hover:underline underline-offset-2">
              Find your school
            </Link>
          </p>
        </div>

        {/* Form section */}
        <div className="w-full max-w-sm">

          {/* Heading */}
          <div className="mb-8">
            <h1 className="text-3xl font-black tracking-tighter text-foreground leading-tight">
              Student sign in.
            </h1>
            <p className="text-sm text-muted-foreground mt-1.5">
              Use the details on your student card to access your portal.
            </p>
          </div>

          {/* Card with gold top accent */}
          <div>
            <div className="h-0.5 rounded-t-2xl bg-gradient-to-r from-[#926C15] via-[#C09020] to-[#D4AA30]" />
            <div className="bg-card rounded-b-2xl border border-t-0 border-border/60 shadow-xl shadow-black/5 px-8 py-8">
              <StudentLoginForm />
            </div>
          </div>

        </div>

      </div>

    </div>
  )
}
