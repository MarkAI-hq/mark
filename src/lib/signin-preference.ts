// src/lib/signin-preference.ts
//
// Remembers which sign-in form a device last used, so the installed app's
// start page (/app) can skip the "Who's signing in?" chooser on the next
// launch. Read by middleware (edge) for a flash-free server redirect, so it
// is a cookie, not localStorage. Not sensitive — it only picks a form.

export const SIGNIN_PREF_COOKIE = 'signin_role'

/** 'student' → /student/login (school code + PIN); 'email' → /login (staff + guardians). */
export type SigninPreference = 'student' | 'email'

export const SIGNIN_PREF_PATH: Record<SigninPreference, string> = {
  student: '/student/login',
  email:   '/login',
}

export function setSigninPreference(pref: SigninPreference): void {
  if (typeof document === 'undefined') return
  const oneYear = 60 * 60 * 24 * 365
  document.cookie = `${SIGNIN_PREF_COOKIE}=${pref}; Path=/; Max-Age=${oneYear}; SameSite=Lax`
}
