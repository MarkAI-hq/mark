'use client'

// src/app/student/(portal)/study-plans/[planId]/studio/_components/studio-entry.tsx
//
// Decides between the chooser (already-completed lesson) and the Studio.
//
// This has to be a client component that latches its decision at mount.
// Completing a lesson flips plan.status to 'completed', the server re-renders
// the page with that new status, and a purely server-side "completed → show
// chooser" rule then replaced the Studio — and the completion screen the
// student was reading — with the chooser a few seconds after it appeared.
// A lesson that was unfinished when the student opened it stays in the Studio
// until they leave; only a lesson that was *already* complete on open gets
// the chooser.

import { useState } from 'react'
import { StudioShell } from './studio-shell'
import { LessonChooser } from './lesson-chooser'

interface Props {
  plan:   any
  scenes: any[]
  user:   any
  from?:  string
  mode?:  string
}

export function StudioEntry({ plan, scenes, user, from, mode }: Props) {
  const isCompleted = plan.status === 'completed'
  const [openedUnfinished] = useState(!isCompleted)

  if (isCompleted && !mode && !openedUnfinished) {
    return <LessonChooser plan={plan} user={user} from={from} />
  }

  return (
    <StudioShell
      plan={plan}
      scenes={scenes}
      user={user}
      isPractice={isCompleted && mode === 'practice'}
    />
  )
}
