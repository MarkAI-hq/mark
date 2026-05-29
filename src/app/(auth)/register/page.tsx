// src/app/(auth)/register/page.tsx
import { Metadata } from 'next'
import { Sparkles, ArrowLeft } from 'lucide-react'
import { SignupForm } from '@/components/auth/signup-form'
import { RegisterLeftPanel } from '@/components/auth/register-left-panel'
import Link from 'next/link'

export const metadata: Metadata = {
  title:       'Get Started — Mirror Intelligence',
  description: 'Create your school account',
}

export default function RegisterPage() {
  return (
    <div className="min-h-screen grid lg:grid-cols-2">

      <RegisterLeftPanel />

      {/* ── Right panel — form ───────────────────────────────────────── */}
      <div className="relative flex flex-col items-center justify-center min-h-screen px-6 py-16 sm:px-10 bg-background">

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
            Have an account?{' '}
            <Link href="/login" className="font-semibold text-[#926C15] hover:underline underline-offset-2">
              Sign in
            </Link>
          </p>
        </div>

        {/* Form section */}
        <div className="w-full max-w-md">

          {/* Heading */}
          <div className="mb-8">
            <div className="inline-flex items-center gap-2 rounded-full border border-[#926C15]/30 bg-[#926C15]/6 px-3.5 py-1 text-xs font-semibold text-[#926C15] mb-5">
              <Sparkles className="h-3 w-3" />
              Free to start · No credit card required
            </div>
            <h1 className="text-3xl font-black tracking-tighter text-foreground leading-tight">
              Set up your school<br />in under 2 minutes.
            </h1>
            <p className="text-sm text-muted-foreground mt-2">
              Join hundreds of schools already on Mirror Intelligence.
            </p>
          </div>

          {/* Card with gold top accent */}
          <div>
            <div className="h-0.5 rounded-t-2xl bg-gradient-to-r from-[#926C15] via-[#C09020] to-[#D4AA30]" />
            <div className="bg-card rounded-b-2xl border border-t-0 border-border/60 shadow-xl shadow-black/5 px-8 py-8">
              <SignupForm />
            </div>
          </div>

        </div>

      </div>

    </div>
  )
}
