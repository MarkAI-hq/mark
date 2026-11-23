'use client'

import Link from 'next/link'
import { GraduationCap, Presentation, Users, ChevronRight, type LucideIcon } from 'lucide-react'
import { SIGNIN_PREF_PATH, setSigninPreference, type SigninPreference } from '@/lib/signin-preference'

const OPTIONS: { pref: SigninPreference; icon: LucideIcon; title: string; desc: string }[] = [
  {
    pref:  'student',
    icon:  GraduationCap,
    title: 'Student',
    desc:  'Sign in with your school code, student ID and PIN.',
  },
  {
    pref:  'email',
    icon:  Presentation,
    title: 'Teacher or school staff',
    desc:  'Sign in with your work email and password.',
  },
  {
    pref:  'email',
    icon:  Users,
    title: 'Parent or guardian',
    desc:  'Sign in with the email your school invited.',
  },
]

export function RoleChooser() {
  return (
    <ul className="space-y-3">
      {OPTIONS.map(({ pref, icon: Icon, title, desc }) => (
        <li key={title}>
          <Link
            href={SIGNIN_PREF_PATH[pref]}
            onClick={() => setSigninPreference(pref)}
            className="group flex items-center gap-4 rounded-2xl border border-border/60 bg-card px-5 py-4 shadow-sm transition-colors hover:border-gold/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold"
          >
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gold/10 text-gold">
              <Icon className="h-5 w-5" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block font-semibold text-foreground">{title}</span>
              <span className="block text-sm text-muted-foreground">{desc}</span>
            </span>
            <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-gold" />
          </Link>
        </li>
      ))}
    </ul>
  )
}
