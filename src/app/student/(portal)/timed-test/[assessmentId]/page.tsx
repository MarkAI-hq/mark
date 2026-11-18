// Test page for the timed-assessment countdown (Focus Mode v1, spec §6).
// mark has no student-facing screen for answering assessments yet, so this
// page exercises the real server flow end-to-end: start/resume a timed
// attempt, show <ExamCountdown/>, save an answer, submit. Replace with the
// real assessment screen when it exists.

import { TimedTestClient } from './timed-test-client'

export default async function TimedTestPage({
  params,
  searchParams,
}: {
  params: Promise<{ assessmentId: string }>
  searchParams: Promise<{ q?: string }>
}) {
  const { assessmentId } = await params
  const { q } = await searchParams
  return <TimedTestClient assessmentId={assessmentId} questionId={q ?? null} />
}
