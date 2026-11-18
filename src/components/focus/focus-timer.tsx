'use client'

// The compact timer face, shared by the dock pill and the play-mode window.

import { Pause, Play, Coffee, Square, Volume2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { formatClock } from '@/lib/focus/engine'
import { SYSTEMS } from '@/lib/focus/systems'
import type { FocusContextValue } from './focus-provider'

export function phaseLabel(f: FocusContextValue): string {
  const v = f.view
  if (v.phase === 'focusing') return v.paused ? 'Paused' : 'Focus'
  if (v.phase === 'break') return v.paused ? 'Paused' : v.isLongBreak ? 'Long break' : 'Break'
  if (v.phase === 'ended') return 'Done'
  return 'Focus'
}

export function clockText(f: FocusContextValue): string {
  if (f.remainingMs != null) return formatClock(f.remainingMs)
  if (f.view.phase === 'focusing') return formatClock(f.focusedMs) // Flowtime counts up
  return '0:00'
}

/** Full compact face used inside the Picture-in-Picture window. */
export function CompactTimer({ f }: { f: FocusContextValue }) {
  const v = f.view
  const isBreak = v.phase === 'break'
  const flow = v.config?.focusMin == null
  return (
    <div
      className={cn(
        'flex h-screen w-screen flex-col items-center justify-center gap-2 p-3 transition-colors duration-500 select-none',
        f.flashing
          ? 'bg-amber-400 text-black'
          : isBreak
            ? 'bg-emerald-50 text-emerald-950 dark:bg-emerald-950 dark:text-emerald-50'
            : 'bg-background text-foreground',
      )}
    >
      <div className="text-[11px] font-semibold uppercase tracking-wider opacity-70">
        {phaseLabel(f)}
        {v.config ? ` · ${SYSTEMS[v.config.system].label}` : ''}
      </div>
      <div className="font-mono text-5xl font-bold tabular-nums leading-none" aria-live="polite">
        {clockText(f)}
      </div>
      {f.breakText && <div className="text-center text-xs leading-snug opacity-80">{f.breakText}</div>}
      {f.ringing ? (
        <div className="flex gap-2">
          <button className="rounded-md bg-black/80 px-2.5 py-1 text-xs font-medium text-white" onClick={() => f.acknowledgeRing('on_break')}>
            I&apos;m on break
          </button>
          <button className="rounded-md border border-current px-2.5 py-1 text-xs font-medium" onClick={() => f.acknowledgeRing('back_to_focus')}>
            Back to focus
          </button>
        </div>
      ) : (
        <div className="flex items-center gap-1.5">
          <IconBtn label={v.paused ? 'Resume' : 'Pause'} onClick={v.paused ? f.resume : f.pause}>
            {v.paused ? <Play className="h-4 w-4" /> : <Pause className="h-4 w-4" />}
          </IconBtn>
          {v.phase === 'focusing' && flow && (
            <IconBtn label="Take a break" onClick={f.takeBreak}>
              <Coffee className="h-4 w-4" />
            </IconBtn>
          )}
          {isBreak && (
            <IconBtn label="Back to focus" onClick={f.skipBreak}>
              <Play className="h-4 w-4" />
            </IconBtn>
          )}
          <IconBtn label="Stop" onClick={f.stop}>
            <Square className="h-4 w-4" />
          </IconBtn>
          {f.audioBlocked && (
            <IconBtn label="Turn sound back on" onClick={f.unlockAudio}>
              <Volume2 className="h-4 w-4" />
            </IconBtn>
          )}
        </div>
      )}
    </div>
  )
}

function IconBtn({ label, onClick, children }: { label: string; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      onClick={onClick}
      className="flex h-8 w-8 items-center justify-center rounded-full border border-black/15 dark:border-white/20 bg-black/5 hover:bg-black/10 dark:bg-white/10 dark:hover:bg-white/20"
    >
      {children}
    </button>
  )
}
