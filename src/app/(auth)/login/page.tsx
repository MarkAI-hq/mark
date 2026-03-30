// src/app/(auth)/login/page.tsx
import { Metadata } from 'next'
import Image from 'next/image'
import { Sparkles, Clock, TrendingUp } from 'lucide-react'
import { LoginForm } from '@/components/auth/login-form'
import Link from 'next/link'

export const metadata: Metadata = {
  title:       'Login — Mark',
  description: 'Login to your account',
}

const HIGHLIGHTS = [
  {
    icon:  Sparkles,
    title: 'Pick up where you left off',
    desc:  'Your assessments, classes, and reports are right where you left them.',
  },
  {
    icon:  Clock,
    title: 'Your time is valuable',
    desc:  "We've been saving it. Every session builds on the last.",
  },
  {
    icon:  TrendingUp,
    title: 'Student progress awaits',
    desc:  'New insights and Bloom\'s analytics may have updated since your last visit.',
  },
]

export default function LoginPage() {
  return (
    <div className="h-screen overflow-hidden grid lg:grid-cols-2">

      {/* ── Left panel ──────────────────────────────────────────────── */}
      <div className="hidden lg:flex flex-col justify-between bg-slate-900 px-12 py-8 text-white">

        {/* Logo */}
        <div>
		<Link href="/">
          <Image
            src="/assets/images/markBlackBg.png"
            alt="Mark logo"
            width={160}
            height={80}
            className="rounded-lg"
          />
		</Link>
        </div>

        {/* Body */}
        <div className="space-y-7">
          <div className="space-y-2.5">
            <h1 className="text-3xl font-bold leading-tight">
              Good to have you back.
            </h1>
            <p className="text-slate-400 text-base leading-relaxed max-w-sm">
              Your school's intelligence platform has been hard at work.
              Sign in to see what's new.
            </p>
          </div>

          <div className="space-y-4">
            {HIGHLIGHTS.map(({ icon: Icon, title, desc }) => (
              <div key={title} className="flex items-start gap-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white/10">
                  <Icon className="h-3.5 w-3.5 text-amber-400" />
                </div>
                <div>
                  <p className="text-sm font-semibold">{title}</p>
                  <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <p className="text-xs text-slate-500">
          © {new Date().getFullYear()} Mark. All rights reserved.
        </p>
      </div>

      {/* ── Right panel — form ───────────────────────────────────────── */}
      <div className="flex flex-col justify-center items-center px-8 py-8 sm:px-12 lg:px-16 bg-slate-50">

        {/* Mobile logo */}
	<Link href="/" className="flex items-center gap-2.5 mb-6 lg:hidden self-start">
        <div className="flex items-center gap-2.5 mb-6 lg:hidden self-start">
          <Image
            src="/assets/images/markBlackBg.png"
            alt="Mark logo"
            width={28}
            height={28}
            className="rounded-lg"
          />
        </div>
	</Link>

        {/* Card */}
        <div className="w-full max-w-md bg-white rounded-2xl border border-slate-200 shadow-sm px-8 py-8 space-y-6">
          <div className="space-y-1">
            <h2 className="text-xl font-bold text-slate-900">Welcome back</h2>
            <p className="text-sm text-slate-500">
              Enter your credentials to access your account.
            </p>
          </div>

          <LoginForm />
        </div>

      </div>

    </div>
  )
}