// src/app/(auth)/register/page.tsx
import { Metadata } from 'next'
import Image from 'next/image'
import { BarChart2, Brain, FileText } from 'lucide-react'
import { SignupForm } from '@/components/auth/signup-form'
import Link from 'next/link'

export const metadata: Metadata = {
  title:       'Get Started — Mark',
  description: 'Create your school account',
}

const FEATURES = [
  {
    icon:  Brain,
    title: 'AI-Powered Grading',
    desc:  'Grade entire classes in minutes with 97%+ accuracy.',
  },
  {
    icon:  BarChart2,
    title: 'Deep Learning Analytics',
    desc:  "Track every student's Bloom's taxonomy progression.",
  },
  {
    icon:  FileText,
    title: 'Instant PDF Reports',
    desc:  'Generate and export student performance reports in one click.',
  },
]

export default function RegisterPage() {
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
              The Learning Intelligence platform for schools.
            </h1>
            <p className="text-slate-400 text-lg leading-relaxed max-w-sm">
              Join hundreds of teachers saving hours every week while giving students deeper actionable feedback.
            </p>
          </div>

          <div className="space-y-5">
            {FEATURES.map(({ icon: Icon, title, desc }) => (
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
      <div className="flex flex-col justify-center items-center px-8 py-16 sm:px-16 lg:px-24 bg-slate-50">

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
        <div className="w-full max-w-sm bg-white rounded-2xl border border-slate-200 shadow-sm px-8 py-10 space-y-8">
          <div className="space-y-1.5">
            <h2 className="text-2xl font-bold text-slate-900">Create your account</h2>
            <p className="text-sm text-slate-500">
              Set up your school in under 2 minutes. No credit card required.
            </p>
          </div>

          <SignupForm />
        </div>

      </div>

    </div>
  )
}