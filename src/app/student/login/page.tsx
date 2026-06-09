// src/app/student/login/page.tsx
import { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { BookOpen, Star, Trophy } from 'lucide-react'
import { StudentLoginForm } from '@/components/auth/students-login-form'

export const metadata: Metadata = {
  title:       'Student Login — Mark',
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
    <div className="min-h-screen grid lg:grid-cols-2">

      {/* ── Left panel ──────────────────────────────────────────────── */}
      <div className="hidden lg:flex flex-col gap-8 bg-slate-900 p-16 text-white">
        <div className="flex items-center gap-3">
          <Link href="/">
            <Image
              src="/assets/images/markBlackBg.png"
              alt="Mark logo"
              width={200}
              height={100}
              className="rounded-lg"
            />
          </Link>
        </div>

        <div className="space-y-10">
          <div className="space-y-3">
            <h1 className="text-4xl font-bold leading-tight">
              Your learning journey<br />continues here.
            </h1>
            <p className="text-slate-400 text-lg leading-relaxed max-w-sm">
              Sign in with your student card details to pick up where you left off.
            </p>
          </div>

          <div className="space-y-5">
            {HIGHLIGHTS.map(({ icon: Icon, title, desc }) => (
              <div key={title} className="flex items-start gap-3.5">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white/10">
                  <Icon className="h-4 w-4 text-amber-400" />
                </div>
                <div>
                  <p className="text-sm font-semibold">{title}</p>
                  <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <p className="text-xs text-slate-500">
          © {new Date().getFullYear()} Mark. All rights reserved.
        </p>
      </div>

      {/* ── Right panel — form ───────────────────────────────────────── */}
      <div className="flex flex-col justify-center items-center px-8 py-16 sm:px-16 lg:px-24 bg-background">

        {/* Mobile logo */}
        <div className="flex items-center gap-2.5 mb-8 lg:hidden self-start">
          <Image
            src="/assets/images/markBlackBg.png"
            alt="Mark logo"
            width={28}
            height={28}
            className="rounded-lg"
          />
        </div>

        {/* Card */}
        <div className="w-full max-w-sm bg-card rounded-2xl border border-border shadow-sm px-8 py-10 space-y-8">
          <div className="space-y-1.5">
            <h2 className="text-2xl font-bold text-foreground">Student sign in</h2>
            <p className="text-sm text-muted-foreground">
              Use the details on your student card to access your portal.
            </p>
          </div>

          <StudentLoginForm />
        </div>

      </div>

    </div>
  )
}