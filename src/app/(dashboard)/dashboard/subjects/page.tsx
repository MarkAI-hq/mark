// src/app/(dashboard)/dashboard/subjects/page.tsx
// Kept as a redirect stub — the real page moved to settings/subjects so it renders
// inside the Settings layout (sidebar + active nav state).

import { redirect } from 'next/navigation'

export default function SubjectsRedirectPage() {
  redirect('/dashboard/settings/subjects')
}
