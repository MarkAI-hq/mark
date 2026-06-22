import { redirect } from 'next/navigation'

interface Props {
  searchParams: Promise<{ curriculumId?: string; subject?: string }>
}

export default async function ProgressPage({ searchParams }: Props) {
  const { curriculumId, subject } = await searchParams
  // Forward the curriculumId the pathway page actually needs. `subject` is
  // accepted for backward-compat links and passed through so the pathway page
  // can resolve it from the student's prediction list.
  const params = new URLSearchParams()
  if (curriculumId) params.set('curriculumId', curriculumId)
  if (subject) params.set('subject', subject)
  const qs = params.toString()
  redirect(`/student/my-pathway${qs ? `?${qs}` : ''}`)
}
