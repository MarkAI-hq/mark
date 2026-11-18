'use client'

// Focus dock (Focus Mode v1, spec §5.4). A pill fixed bottom-right on every
// student portal page; expands into the start / control / end panel.
// Hidden entirely while a timed assessment holds the exam lock.

import { useEffect, useRef, useState, type KeyboardEvent } from 'react'
import { Bell, ChevronDown, Pause, PictureInPicture2, Play, Square, Star, Timer, Volume2, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { cn } from '@/lib/utils'
import { formatClock } from '@/lib/focus/engine'
import {
  CUSTOM_LIMITS,
  SOUND_ORDER,
  SOUNDS,
  SYSTEM_ORDER,
  SYSTEMS,
  type FocusSoundId,
} from '@/lib/focus/systems'
import { useFocus } from './focus-provider'
import { clockText, phaseLabel } from './focus-timer'
import { PlayMode } from './play-mode'

export function FocusDock() {
  const f = useFocus()
  const [open, setOpen] = useState(false)
  const [subject, setSubject] = useState('')
  const [topic, setTopic] = useState('')
  const [rating, setRating] = useState<number | null>(null)
  const [note, setNote] = useState('')
  const panelRef = useRef<HTMLDivElement>(null)
  const v = f.view
  const running = v.phase === 'focusing' || v.phase === 'break'

  // Open the panel for the end-of-session rating.
  useEffect(() => {
    if (v.phase === 'ended') {
      setOpen(true)
      setRating(null)
      setNote('')
    }
  }, [v.phase])

  if (!f.hydrated || f.examLocked) return null

  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'Escape') {
      setOpen(false)
      return
    }
    const tag = (e.target as HTMLElement).tagName
    if (e.key === ' ' && running && !['INPUT', 'TEXTAREA', 'SELECT', 'BUTTON'].includes(tag)) {
      e.preventDefault()
      if (v.paused) f.resume()
      else f.pause()
    }
  }

  return (
    <>
      <PlayMode />
      <div
        ref={panelRef}
        role="region"
        aria-label="Focus timer"
        tabIndex={-1}
        onKeyDown={onKeyDown}
        className="fixed bottom-4 right-4 z-40 flex flex-col items-end gap-2 outline-none print:hidden"
      >
        {f.resumeOffer && !running && (
          <div className="w-72 rounded-xl border bg-background p-3 text-sm shadow-lg">
            <p className="font-medium">Continue your focus session?</p>
            <p className="mt-0.5 text-xs text-muted-foreground">
              You started a {SYSTEMS[f.resumeOffer.system].label} session
              {f.resumeOffer.goal_subject ? ` on ${f.resumeOffer.goal_subject}` : ''} on another device or tab.
            </p>
            <div className="mt-2 flex gap-2">
              <Button size="sm" onClick={f.acceptResume}>Resume</Button>
              <Button size="sm" variant="outline" onClick={f.declineResume}>End it</Button>
            </div>
          </div>
        )}

        {f.notifPrompt && (
          <div className="w-72 rounded-xl border bg-background p-3 text-sm shadow-lg">
            <p className="flex items-center gap-1.5 font-medium"><Bell className="h-4 w-4" /> Break alarms in other apps</p>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Allow notifications so Mirror can tell you when a break starts, even while you work in another window.
            </p>
            <div className="mt-2 flex gap-2">
              <Button size="sm" onClick={() => void f.allowNotifications()}>Allow</Button>
              <Button size="sm" variant="ghost" onClick={f.dismissNotifPrompt}>Not now</Button>
            </div>
          </div>
        )}

        {open && (
          <div className="w-80 max-w-[calc(100vw-2rem)] rounded-2xl border bg-background p-4 shadow-xl">
            <div className="mb-3 flex items-center justify-between">
              <p className="flex items-center gap-1.5 text-sm font-semibold"><Timer className="h-4 w-4" /> Focus</p>
              <button aria-label="Collapse" className="rounded p-1 text-muted-foreground hover:bg-muted" onClick={() => setOpen(false)}>
                <ChevronDown className="h-4 w-4" />
              </button>
            </div>

            {v.phase === 'ended' ? (
              <EndPanel
                minutes={Math.floor(f.focusedMs / 60_000)}
                completed={v.endStatus === 'completed'}
                rating={rating}
                setRating={setRating}
                note={note}
                setNote={setNote}
                onDone={() => {
                  f.finish(rating ?? undefined, note)
                  setOpen(false)
                }}
                onSkip={() => {
                  f.finish()
                  setOpen(false)
                }}
              />
            ) : running ? (
              <RunningPanel />
            ) : (
              <StartPanel subject={subject} setSubject={setSubject} topic={topic} setTopic={setTopic} />
            )}
          </div>
        )}

        <Pill open={open} onToggle={() => setOpen((o) => !o)} />
      </div>
    </>
  )
}

function Pill({ open, onToggle }: { open: boolean; onToggle: () => void }) {
  const f = useFocus()
  const v = f.view
  const running = v.phase === 'focusing' || v.phase === 'break'
  return (
    <div
      className={cn(
        'flex items-center gap-1 rounded-full border shadow-lg transition-colors',
        f.flashing ? 'bg-amber-400 text-black' : v.phase === 'break' ? 'bg-emerald-50 text-emerald-950 dark:bg-emerald-950 dark:text-emerald-50' : 'bg-background',
      )}
    >
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        aria-label={running ? `Focus timer, ${phaseLabel(f)}, ${clockText(f)} left` : 'Open focus timer'}
        className="flex items-center gap-2 rounded-full py-2 pl-3 pr-2 text-sm"
      >
        <Timer className="h-4 w-4" />
        {running ? (
          <>
            <span className="font-mono font-semibold tabular-nums">{clockText(f)}</span>
            <span className="text-xs text-muted-foreground">{phaseLabel(f)}</span>
          </>
        ) : (
          <span className="font-medium">Focus</span>
        )}
      </button>
      {running && (
        <button
          type="button"
          aria-label={v.paused ? 'Resume' : 'Pause'}
          onClick={v.paused ? f.resume : f.pause}
          className="mr-1 flex h-7 w-7 items-center justify-center rounded-full hover:bg-muted"
        >
          {v.paused ? <Play className="h-3.5 w-3.5" /> : <Pause className="h-3.5 w-3.5" />}
        </button>
      )}
    </div>
  )
}

function SoundPicker() {
  const f = useFocus()
  const sound = f.view.phase === 'focusing' || f.view.phase === 'break' ? f.view.sound : f.prefs.sound
  return (
    <div className="space-y-2">
      <p className="text-xs font-medium text-muted-foreground">Sound</p>
      <div className="flex flex-wrap gap-1.5">
        {SOUND_ORDER.map((s: FocusSoundId) => (
          <button
            key={s}
            type="button"
            onClick={() => f.setSound(s)}
            className={cn(
              'rounded-full border px-2.5 py-1 text-xs',
              sound === s ? 'border-primary bg-primary text-primary-foreground' : 'hover:bg-muted',
            )}
          >
            {SOUNDS[s].label}
          </button>
        ))}
      </div>
      {sound === 'pulse' && (
        <div className="flex items-center gap-2 text-xs">
          <span className="text-muted-foreground">Pulse depth</span>
          {(['off', 'low', 'high'] as const).map((d) => (
            <button
              key={d}
              type="button"
              onClick={() => f.setPrefs({ pulseDepth: d })}
              className={cn('rounded border px-2 py-0.5 capitalize', f.prefs.pulseDepth === d ? 'border-primary bg-primary/10' : '')}
            >
              {d}
            </button>
          ))}
        </div>
      )}
      <label className="flex items-center gap-2 text-xs text-muted-foreground">
        <Volume2 className="h-3.5 w-3.5" />
        <input
          type="range"
          min={0}
          max={100}
          value={f.prefs.volume}
          onChange={(e) => f.setVolume(Number(e.target.value))}
          className="w-full accent-current"
          aria-label="Volume"
        />
        <span className="w-7 text-right tabular-nums">{f.prefs.volume}</span>
      </label>
    </div>
  )
}

function StartPanel(props: {
  subject: string
  setSubject: (s: string) => void
  topic: string
  setTopic: (s: string) => void
}) {
  const f = useFocus()
  const { system, custom, ringMode } = f.prefs
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <p className="text-xs font-medium text-muted-foreground">Goal (optional)</p>
        <Input placeholder="Subject, e.g. Biology" value={props.subject} onChange={(e) => props.setSubject(e.target.value)} maxLength={120} />
        <Input placeholder="Topic, e.g. Photosynthesis" value={props.topic} onChange={(e) => props.setTopic(e.target.value)} maxLength={200} />
      </div>

      <div className="space-y-2">
        <p className="text-xs font-medium text-muted-foreground">System</p>
        <div className="grid grid-cols-2 gap-1.5">
          {SYSTEM_ORDER.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => f.setPrefs({ system: s })}
              className={cn(
                'rounded-lg border p-2 text-left',
                system === s ? 'border-primary bg-primary/10' : 'hover:bg-muted',
              )}
            >
              <span className="block text-sm font-medium">{SYSTEMS[s].label}</span>
              <span className="block text-[11px] leading-tight text-muted-foreground">{SYSTEMS[s].summary}</span>
            </button>
          ))}
        </div>
        {system === 'custom' && (
          <div className="grid grid-cols-2 gap-2 text-xs">
            <NumberField
              label="Focus (min)"
              value={custom.focusMin}
              min={CUSTOM_LIMITS.focusMin.min}
              max={CUSTOM_LIMITS.focusMin.max}
              onChange={(n) => f.setPrefs({ custom: { ...custom, focusMin: n } })}
            />
            <NumberField
              label="Break (min)"
              value={custom.breakMin}
              min={CUSTOM_LIMITS.breakMin.min}
              max={CUSTOM_LIMITS.breakMin.max}
              onChange={(n) => f.setPrefs({ custom: { ...custom, breakMin: n } })}
            />
            <label className="col-span-2 flex items-center justify-between">
              <span>Long break every 4 rounds</span>
              <Switch checked={custom.longBreak} onCheckedChange={(c) => f.setPrefs({ custom: { ...custom, longBreak: c } })} />
            </label>
            {custom.longBreak && (
              <NumberField
                label="Long break (min)"
                value={custom.longBreakMin}
                min={CUSTOM_LIMITS.longBreakMin.min}
                max={CUSTOM_LIMITS.longBreakMin.max}
                onChange={(n) => f.setPrefs({ custom: { ...custom, longBreakMin: n } })}
              />
            )}
          </div>
        )}
      </div>

      <SoundPicker />

      <label className="flex items-center justify-between text-xs">
        <span>
          <span className="font-medium">Ring until I respond</span>
          <span className="block text-muted-foreground">Repeats the alarm every 30 s, up to 3 times</span>
        </span>
        <Switch checked={ringMode} onCheckedChange={(c) => f.setPrefs({ ringMode: c })} />
      </label>

      <Button className="w-full" onClick={() => f.start({ subject: props.subject, topic: props.topic })}>
        <Play className="mr-1.5 h-4 w-4" /> Start
      </Button>
    </div>
  )
}

function RunningPanel() {
  const f = useFocus()
  const v = f.view
  const flow = v.config?.focusMin == null
  return (
    <div className="space-y-4">
      <div className="text-center">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          {phaseLabel(f)} · {v.config ? SYSTEMS[v.config.system].label : ''}
        </p>
        <p className="font-mono text-4xl font-bold tabular-nums">{clockText(f)}</p>
        {f.breakText && <p className="mt-1 text-xs text-muted-foreground">{f.breakText}</p>}
        {(v.goalSubject || v.goalTopic) && (
          <p className="mt-1 text-xs text-muted-foreground">{[v.goalSubject, v.goalTopic].filter(Boolean).join(' · ')}</p>
        )}
        <p className="mt-1 text-xs text-muted-foreground">
          {formatClock(f.focusedMs)} focused · {v.roundsCompleted} round{v.roundsCompleted === 1 ? '' : 's'}
        </p>
      </div>

      {f.ringing && (
        <div className="flex gap-2">
          <Button size="sm" className="flex-1" onClick={() => f.acknowledgeRing('on_break')}>I&apos;m on break</Button>
          <Button size="sm" variant="outline" className="flex-1" onClick={() => f.acknowledgeRing('back_to_focus')}>Back to focus</Button>
        </div>
      )}

      {f.audioBlocked && (
        <Button size="sm" variant="secondary" className="w-full" onClick={f.unlockAudio}>
          <Volume2 className="mr-1.5 h-4 w-4" /> Tap to turn the sound back on
        </Button>
      )}

      <div className="flex flex-wrap gap-2">
        <Button size="sm" variant="outline" onClick={v.paused ? f.resume : f.pause}>
          {v.paused ? <Play className="mr-1 h-4 w-4" /> : <Pause className="mr-1 h-4 w-4" />}
          {v.paused ? 'Resume' : 'Pause'}
        </Button>
        {v.phase === 'focusing' && flow && (
          <Button size="sm" variant="outline" onClick={f.takeBreak}>Take a break</Button>
        )}
        {v.phase === 'break' && !f.ringing && (
          <Button size="sm" variant="outline" onClick={f.skipBreak}>Back to focus</Button>
        )}
        <Button size="sm" variant="outline" onClick={f.stop}>
          <Square className="mr-1 h-4 w-4" /> Stop
        </Button>
        {f.pipSupported && !f.pipWindow && (
          <Button size="sm" variant="outline" onClick={() => void f.openPip()}>
            <PictureInPicture2 className="mr-1 h-4 w-4" /> Pop out
          </Button>
        )}
      </div>

      <SoundPicker />
    </div>
  )
}

function EndPanel(p: {
  minutes: number
  completed: boolean
  rating: number | null
  setRating: (n: number) => void
  note: string
  setNote: (s: string) => void
  onDone: () => void
  onSkip: () => void
}) {
  return (
    <div className="space-y-3">
      <div>
        <p className="text-sm font-medium">
          {p.completed ? `Studied ${p.minutes} minute${p.minutes === 1 ? '' : 's'}.` : `Session ended after ${p.minutes} minute${p.minutes === 1 ? '' : 's'}.`}
        </p>
        <p className="text-xs text-muted-foreground">How focused did you feel? (optional)</p>
      </div>
      <div className="flex gap-1" role="radiogroup" aria-label="Focus rating">
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            role="radio"
            aria-checked={p.rating === n}
            aria-label={`${n} of 5`}
            onClick={() => p.setRating(n)}
            className="rounded p-1 hover:bg-muted"
          >
            <Star className={cn('h-6 w-6', p.rating != null && n <= p.rating ? 'fill-amber-400 text-amber-400' : 'text-muted-foreground')} />
          </button>
        ))}
      </div>
      <Textarea placeholder="A note for yourself (optional)" value={p.note} maxLength={500} rows={2} onChange={(e) => p.setNote(e.target.value)} />
      <div className="flex gap-2">
        <Button size="sm" className="flex-1" onClick={p.onDone}>Save</Button>
        <Button size="sm" variant="ghost" onClick={p.onSkip}>
          <X className="mr-1 h-4 w-4" /> Skip
        </Button>
      </div>
    </div>
  )
}

function NumberField(p: { label: string; value: number; min: number; max: number; onChange: (n: number) => void }) {
  return (
    <label className="space-y-1">
      <span className="text-muted-foreground">{p.label}</span>
      <Input
        type="number"
        min={p.min}
        max={p.max}
        value={p.value}
        onChange={(e) => {
          const n = Number(e.target.value)
          if (Number.isFinite(n)) p.onChange(Math.min(p.max, Math.max(p.min, Math.round(n))))
        }}
      />
    </label>
  )
}
