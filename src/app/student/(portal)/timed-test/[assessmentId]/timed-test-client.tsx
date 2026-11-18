'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { ExamCountdown } from '@/components/focus/exam-countdown'
import {
  saveAttemptResponse,
  startOrResumeAttempt,
  submitAttempt,
  type TimedSubmission,
} from '@/lib/actions/submissions'

export function TimedTestClient({ assessmentId, questionId }: { assessmentId: string; questionId: string | null }) {
  const [sub, setSub] = useState<TimedSubmission | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [answer, setAnswer] = useState('')
  const [log, setLog] = useState<string[]>([])
  const answerRef = useRef(answer)
  answerRef.current = answer

  const note = (m: string) => setLog((l) => [`${new Date().toLocaleTimeString()} ${m}`, ...l].slice(0, 20))

  useEffect(() => {
    startOrResumeAttempt(assessmentId).then((res) => {
      if (res.error) setError(res.error.message)
      else setSub(res.data)
    })
  }, [assessmentId])

  const save = useCallback(async () => {
    if (!sub || !questionId) return
    const res = await saveAttemptResponse(sub.submission_id, questionId, answerRef.current)
    note(res.error ? `save failed (${res.error.status}): ${res.error.message}` : 'answer saved')
  }, [sub, questionId])

  const submit = async () => {
    if (!sub) return
    const res = await submitAttempt(sub.submission_id)
    if (res.error) note(`submit failed (${res.error.status}): ${res.error.message}`)
    else {
      setSub(res.data)
      note(`submitted (${res.data?.status})`)
    }
  }

  if (error) return <p className="p-6 text-sm text-destructive">Could not start the attempt: {error}</p>
  if (!sub) return <p className="p-6 text-sm text-muted-foreground">Starting…</p>

  const open = sub.status === 'Pending'

  return (
    <div className="mx-auto max-w-2xl">
      {open && sub.deadline_at && <ExamCountdown submission={sub} onExpire={save} />}
      <div className="space-y-4 p-6">
        <h1 className="text-xl font-semibold">Timed attempt (test page)</h1>
        <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-sm">
          <dt className="text-muted-foreground">Submission</dt><dd className="font-mono text-xs">{sub.submission_id}</dd>
          <dt className="text-muted-foreground">Status</dt><dd>{sub.status}</dd>
          <dt className="text-muted-foreground">Started</dt><dd>{sub.started_at ?? 'untimed'}</dd>
          <dt className="text-muted-foreground">Deadline</dt><dd>{sub.deadline_at ?? 'untimed'}</dd>
          <dt className="text-muted-foreground">Server time</dt><dd>{sub.server_now}</dd>
        </dl>
        {questionId ? (
          <div className="space-y-2">
            <Textarea value={answer} onChange={(e) => setAnswer(e.target.value)} placeholder="Answer" rows={3} disabled={!open} />
            <Button size="sm" variant="outline" onClick={() => void save()} disabled={!open}>Save answer</Button>
          </div>
        ) : (
          <p className="text-xs text-muted-foreground">Add ?q=&lt;question id&gt; to the URL to test saving an answer.</p>
        )}
        <Button onClick={() => void submit()} disabled={!open}>Submit</Button>
        <ul className="space-y-0.5 font-mono text-xs text-muted-foreground">
          {log.map((l, i) => <li key={i}>{l}</li>)}
        </ul>
      </div>
    </div>
  )
}
