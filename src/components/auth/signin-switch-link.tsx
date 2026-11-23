'use client'

// Cross-link between the two sign-in forms (/login ↔ /student/login). Updates
// the remembered sign-in preference too, so the installed app's start page
// opens the form that actually worked next time.

import Link from 'next/link'
import { SIGNIN_PREF_PATH, setSigninPreference, type SigninPreference } from '@/lib/signin-preference'

export function SigninSwitchLink({
  to,
  prompt,
  label,
}: {
  to:     SigninPreference
  prompt: string
  label:  string
}) {
  return (
    <p className="mt-6 text-center text-sm text-muted-foreground">
      {prompt}{' '}
      <Link
        href={SIGNIN_PREF_PATH[to]}
        onClick={() => setSigninPreference(to)}
        className="font-semibold text-gold hover:underline underline-offset-2"
      >
        {label} →
      </Link>
    </p>
  )
}
