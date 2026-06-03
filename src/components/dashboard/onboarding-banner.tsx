'use client'

// src/components/dashboard/onboarding-banner.tsx

import { useState, useEffect, useRef } from 'react'
import { useRouter }                   from 'next/navigation'
import type { StatsResponse }          from '@/lib/actions/stats'

const storageKey = (userId: string) => `mirror_onboarding_v2_${userId}`

const REMIND_DELAY_MS  = 24 * 60 * 60 * 1000
const ARRIVAL_TTL_MS   = 24 * 60 * 60 * 1000
const CAL_ATTRS = {
  'data-cal-link':      'tusii-mirror/30min',
  'data-cal-namespace': '30min',
  'data-cal-config':    '{"layout":"month_view","useSlotsViewOnSmallScreen":"true"}',
} as const

interface Step {
  id:       string
  label:    string
  subtitle: string
  href:     string
}

const STEPS_BY_ROLE: Record<'Admin' | 'Teacher', Step[]> = {
  Admin: [
    { id: 'create_subject',    label: 'Create your first subject', subtitle: 'Subjects organise your entire curriculum in Mirror.',              href: '/dashboard/subjects'     },
    { id: 'create_course',     label: 'Create a course',           subtitle: 'Courses live inside subjects and hold your assessments.',          href: '/dashboard/courses'      },
    { id: 'create_class',      label: 'Create a class',            subtitle: 'Classes group students so Mirror builds school-wide insights.',    href: '/dashboard/classes'      },
    { id: 'upload_assessment', label: 'Create an assessment',      subtitle: 'Upload a marking scheme — Mirror grades every script against it.', href: '/dashboard/exams'        },
    { id: 'grade_scripts',     label: 'Grade with Mirror',         subtitle: 'Cognitive profiles and error patterns in 60 seconds.',             href: '/dashboard/exams'        },
  ],
  Teacher: [
    { id: 'create_subject',    label: 'Explore your subjects',  subtitle: 'See how your curriculum is structured in Mirror.',                href: '/dashboard/subjects'        },
    { id: 'create_course',     label: 'View your courses',      subtitle: 'Your assigned courses and their assessments live here.',          href: '/dashboard/courses'         },
    { id: 'create_class',      label: 'Meet your classes',      subtitle: 'See your students and their cognitive profiles.',                href: '/dashboard/teacher/classes' },
    { id: 'upload_assessment', label: 'Create an assessment',   subtitle: 'Upload a marking scheme — Mirror grades every script against it.',href: '/dashboard/exams'           },
    { id: 'grade_scripts',     label: 'Grade with Mirror',      subtitle: 'Cognitive profiles and error patterns in 60 seconds.',            href: '/dashboard/exams'           },
  ],
}

interface StoredState {
  remindAt?:         number
  dismissed:         boolean
  celebrated?:       boolean
  arrivalDismissed?: boolean
  arrivedAt?:        number
}

interface OnboardingBannerProps {
  stats:      StatsResponse
  role?:      'Admin' | 'Teacher'
  userId:     string
  schoolName: string
}

export function OnboardingBanner({ stats, role = 'Admin', userId, schoolName }: OnboardingBannerProps) {
  const router = useRouter()

  const [snoozed,     setSnoozed]     = useState(false)
  const [dismissed,   setDismissed]   = useState(false)
  const [mounted,     setMounted]     = useState(false)
  const [justDone,    setJustDone]    = useState(false)
  const [showArrival, setShowArrival] = useState(false)
  const [newlyDone,   setNewlyDone]   = useState<string | null>(null)
  const prevCompleted = useRef<Record<string, boolean>>({})

  const STEPS = STEPS_BY_ROLE[role] ?? STEPS_BY_ROLE.Admin

  const completed: Record<string, boolean> = {
    create_subject:    stats.totalSubjects > 0,
    create_course:     stats.totalCourses  > 0,
    create_class:      stats.totalClasses  > 0,
    upload_assessment: stats.totalExams    > 0,
    grade_scripts:     stats.markedPapers  > 0,
  }

  const completedCount = STEPS.filter(s => completed[s.id]).length
  const totalSteps     = STEPS.length
  const progressPct    = Math.round((completedCount / totalSteps) * 100)
  const allDone        = completedCount === totalSteps
  const nextStep       = STEPS.find(s => !completed[s.id])
  const remainingSteps = STEPS.filter(s => !completed[s.id])

  // Refresh stats when the user returns to the tab (not on mount)
  useEffect(() => {
    const onFocus = () => router.refresh()
    window.addEventListener('focus', onFocus)
    return () => window.removeEventListener('focus', onFocus)
  }, [router])

  // Detect newly completed step for flash animation
  useEffect(() => {
    if (!mounted) return
    for (const step of STEPS) {
      if (completed[step.id] && !prevCompleted.current[step.id]) {
        setNewlyDone(step.id)
        setTimeout(() => setNewlyDone(null), 1000)
        break
      }
    }
    prevCompleted.current = { ...completed }
  }, [stats.totalSubjects, stats.totalCourses, stats.totalClasses, stats.totalExams, stats.markedPapers, mounted])

  // Load persisted state
  useEffect(() => {
    setMounted(true)
    try {
      const raw = localStorage.getItem(storageKey(userId))
      if (!raw) {
        if (completedCount > 0) {
          setShowArrival(true)
          saveState({ arrivedAt: Date.now(), arrivalDismissed: false })
        }
        return
      }
      const p: StoredState = JSON.parse(raw)
      if (p.dismissed) { setDismissed(true); return }
      if (p.remindAt && Date.now() < p.remindAt) { setSnoozed(true); return }
      if (!p.arrivalDismissed && p.arrivedAt && Date.now() - p.arrivedAt < ARRIVAL_TTL_MS) {
        setShowArrival(true)
      } else if (!p.arrivedAt && completedCount > 0) {
        setShowArrival(true)
        saveState({ arrivedAt: Date.now(), arrivalDismissed: false })
      }
    } catch {}
  }, [userId])

  // Trigger completion card
  useEffect(() => {
    if (!mounted || !allDone) return
    try {
      const raw = localStorage.getItem(storageKey(userId))
      const p: StoredState = raw ? JSON.parse(raw) : {}
      if (!p.celebrated) setJustDone(true)
    } catch {}
  }, [allDone, mounted, userId])

  const saveState = (patch: Partial<StoredState>) => {
    try {
      const raw  = localStorage.getItem(storageKey(userId))
      const prev: StoredState = raw ? JSON.parse(raw) : { dismissed: false }
      localStorage.setItem(storageKey(userId), JSON.stringify({ ...prev, ...patch }))
    } catch {}
  }

  const handleRemindLater = () => {
    setSnoozed(true)
    saveState({ remindAt: Date.now() + REMIND_DELAY_MS })
  }

  const handleDismissCompletion = () => {
    setJustDone(false)
    setDismissed(true)
    saveState({ dismissed: true, celebrated: true })
  }

  const handleDismissArrival = () => {
    setShowArrival(false)
    saveState({ arrivalDismissed: true })
  }

  if (!mounted || dismissed || snoozed) return null

  // ── Arrival card ───────────────────────────────────────────────────────
  if (showArrival && !allDone) {
    const doneItems: string[] = []
    if (completed.create_subject) doneItems.push(`${stats.totalSubjects} subject${stats.totalSubjects !== 1 ? 's' : ''}`)
    if (completed.create_class)   doneItems.push(`${stats.totalClasses} class${stats.totalClasses !== 1 ? 'es' : ''}`)
    if (stats.totalStudents > 0)  doneItems.push(`${stats.totalStudents} student${stats.totalStudents !== 1 ? 's' : ''}`)
    const doneText = doneItems.length > 0 ? doneItems.join(', ') : 'your school profile'

    return (
      <>
        <style>{`
          @keyframes mirrorFadeIn {
            from { opacity:0; transform:translateY(-6px); }
            to   { opacity:1; transform:translateY(0); }
          }
          @keyframes mirrorSlideUp {
            from { opacity:0; transform:translateY(8px); }
            to   { opacity:1; transform:translateY(0); }
          }
        `}</style>
        <div
          className="rounded-xl overflow-hidden"
          style={{
            border:    '1px solid rgba(201,168,76,0.3)',
            background:'rgba(201,168,76,0.06)',
            animation: 'mirrorFadeIn 0.4s ease',
          }}
        >
          <div style={{ height: 3, background: 'linear-gradient(90deg, #C9A84C, #E8C96A)' }} />
          <div className="p-6">
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-5">
              <div className="flex-1" style={{ animation: 'mirrorSlideUp 0.45s ease 0.05s both' }}>
                <p className="text-xs font-semibold uppercase tracking-widest mb-2" style={{ color: '#C9A84C' }}>
                  Welcome to Mirror Intelligence
                </p>
                <h3
                  className="text-lg font-semibold leading-snug mb-1.5"
                  style={{ fontFamily: 'Georgia, serif', color: 'hsl(var(--foreground))' }}
                >
                  {schoolName} is live.
                </h3>
                <p className="text-sm leading-relaxed text-muted-foreground">
                  You&apos;ve set up {doneText}. One thing left before your first assessment —{' '}
                  {nextStep
                    ? <span style={{ color: 'hsl(var(--foreground))', fontWeight: 500 }}>{nextStep.label.toLowerCase()}</span>
                    : 'you\'re almost there'
                  }.
                </p>
              </div>
              <div
                className="flex sm:flex-col items-center sm:items-end gap-3 flex-shrink-0"
                style={{ animation: 'mirrorSlideUp 0.45s ease 0.1s both' }}
              >
                {nextStep && (
                  <button
                    onClick={() => {
                      saveState({ arrivalDismissed: true })
                      router.push(`${nextStep.href}?new=true`)
                    }}
                    className="text-sm font-semibold px-5 py-2.5 rounded-lg transition-all whitespace-nowrap"
                    style={{ background: '#C9A84C', color: '#060E24' }}
                    onMouseEnter={e => (e.currentTarget.style.background = '#E8C96A')}
                    onMouseLeave={e => (e.currentTarget.style.background = '#C9A84C')}
                  >
                    {nextStep.label} →
                  </button>
                )}
                <button
                  onClick={handleDismissArrival}
                  className="text-xs transition-colors"
                  style={{ color: 'hsl(var(--muted-foreground))' }}
                  onMouseEnter={e => (e.currentTarget.style.color = 'hsl(var(--foreground))')}
                  onMouseLeave={e => (e.currentTarget.style.color = 'hsl(var(--muted-foreground))')}
                >
                  Show checklist
                </button>
              </div>
            </div>
            <div
              className="flex flex-wrap gap-2 mt-5 pt-4"
              style={{
                borderTop: '1px solid rgba(201,168,76,0.15)',
                animation: 'mirrorSlideUp 0.45s ease 0.15s both',
              }}
            >
              {STEPS.map(step => (
                <div
                  key={step.id}
                  className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium"
                  style={{
                    background: completed[step.id] ? 'rgba(201,168,76,0.15)' : 'hsl(var(--muted))',
                    color:      completed[step.id] ? '#C9A84C'                : 'hsl(var(--muted-foreground))',
                  }}
                >
                  {completed[step.id] ? (
                    <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                      <path d="M1.5 5l2.5 2.5 4.5-4.5" stroke="#C9A84C" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  ) : (
                    <svg width="8" height="8" viewBox="0 0 8 8" fill="none">
                      <circle cx="4" cy="4" r="3" stroke="currentColor" strokeWidth="1.5" />
                    </svg>
                  )}
                  {step.label}
                </div>
              ))}
            </div>
          </div>
        </div>
      </>
    )
  }

  // ── Completion card ────────────────────────────────────────────────────
  if (justDone) {
    return (
      <>
        <style>{`
          @keyframes mirrorFadeIn {
            from { opacity:0; transform:translateY(-6px); }
            to   { opacity:1; transform:translateY(0); }
          }
          @keyframes mirrorCheckPop {
            0%  { transform:scale(0.4); opacity:0; }
            65% { transform:scale(1.2); }
            100%{ transform:scale(1);   opacity:1; }
          }
        `}</style>
        <div
          className="rounded-xl p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
          style={{
            background: 'rgba(201,168,76,0.08)',
            border:     '1px solid rgba(201,168,76,0.35)',
            animation:  'mirrorFadeIn 0.4s ease',
          }}
        >
          <div className="flex items-center gap-4">
            <div
              className="flex-shrink-0 w-11 h-11 rounded-full flex items-center justify-center"
              style={{ background: '#C9A84C', animation: 'mirrorCheckPop 0.5s ease' }}
            >
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                <path d="M3.5 10l4.5 4.5 8.5-8.5" stroke="#060E24" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <div>
              <h3
                className="text-base font-semibold"
                style={{ fontFamily: 'Georgia, serif', color: 'hsl(var(--foreground))' }}
              >
                You&apos;re all set up.
              </h3>
              <p className="text-sm text-muted-foreground mt-0.5">
                Mirror is ready to grade scripts and build cognitive profiles for your school.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3 flex-shrink-0">
            <button
              onClick={() => router.push('/dashboard/exams?new=true')}
              className="text-sm font-semibold px-4 py-2 rounded-lg transition-all"
              style={{ background: '#C9A84C', color: '#060E24' }}
              onMouseEnter={e => (e.currentTarget.style.background = '#E8C96A')}
              onMouseLeave={e => (e.currentTarget.style.background = '#C9A84C')}
            >
              Start grading →
            </button>
            <button
              onClick={handleDismissCompletion}
              className="text-xs transition-colors"
              style={{ color: 'hsl(var(--muted-foreground))' }}
              onMouseEnter={e => (e.currentTarget.style.color = 'hsl(var(--foreground))')}
              onMouseLeave={e => (e.currentTarget.style.color = 'hsl(var(--muted-foreground))')}
            >
              Dismiss
            </button>
          </div>
        </div>
      </>
    )
  }

  // ── Main banner (checklist + video) ────────────────────────────────────
  return (
    <>
      <style>{`
        @keyframes mirrorFadeIn {
          from { opacity:0; transform:translateY(-6px); }
          to   { opacity:1; transform:translateY(0); }
        }
        @keyframes mirrorCheckPop {
          0%  { transform:scale(0.4); opacity:0; }
          65% { transform:scale(1.2); }
          100%{ transform:scale(1);   opacity:1; }
        }
        @keyframes mirrorRowFlash {
          0%   { background: rgba(201,168,76,0.28); }
          100% { background: rgba(201,168,76,0.10); }
        }
      `}</style>

      <div
        className="grid grid-cols-1 md:grid-cols-2 gap-4"
        style={{ animation: 'mirrorFadeIn 0.35s ease' }}
      >
        {/* LEFT — Checklist */}
        <div
          className="rounded-xl overflow-hidden"
          style={{
            background: 'rgba(201,168,76,0.07)',
            border:     '1px solid rgba(201,168,76,0.2)',
          }}
        >
          <div
            className="flex items-center justify-between px-5 py-3"
            style={{ borderBottom: '1px solid rgba(201,168,76,0.12)' }}
          >
            <div className="flex items-center gap-2.5">
              <h3
                className="text-sm font-semibold"
                style={{ fontFamily: 'Georgia, serif', color: 'hsl(var(--foreground))' }}
              >
                Check list
              </h3>
              <span
                className="text-xs font-bold px-2 py-0.5 rounded-full"
                style={{ background: 'rgba(201,168,76,0.15)', color: '#C9A84C' }}
              >
                {completedCount}/{totalSteps}
              </span>
            </div>
            <button
              onClick={handleRemindLater}
              className="text-xs transition-colors"
              style={{ color: 'hsl(var(--muted-foreground))' }}
              onMouseEnter={e => (e.currentTarget.style.color = 'hsl(var(--foreground))')}
              onMouseLeave={e => (e.currentTarget.style.color = 'hsl(var(--muted-foreground))')}
            >
              Remind me later
            </button>
          </div>

          <div style={{ height: 3, background: 'rgba(255,255,255,0.05)' }}>
            <div
              style={{
                height:     '100%',
                width:      `${progressPct}%`,
                background: '#C9A84C',
                transition: 'width 0.6s cubic-bezier(0.4,0,0.2,1)',
              }}
            />
          </div>

          <div className="flex flex-col gap-1 p-4">
            {remainingSteps.map((step, idx) => {
              const isCurrent = idx === 0
              const isAhead   = idx > 0
              const isNew     = newlyDone === step.id

              return (
                <button
                  key={step.id}
                  onClick={() => router.push(`${step.href}?new=true`)}
                  className="flex items-start gap-3 w-full text-left px-3 py-2.5 rounded-lg transition-all group"
                  style={{
                    background: isNew
                      ? 'rgba(201,168,76,0.28)'
                      : isCurrent
                        ? 'rgba(201,168,76,0.10)'
                        : 'transparent',
                    border:    isCurrent ? '1px solid rgba(201,168,76,0.25)' : '1px solid transparent',
                    opacity:   isAhead ? 0.45 : 1,
                    animation: isNew ? 'mirrorRowFlash 1s ease forwards' : undefined,
                  }}
                >
                  <div className="flex-shrink-0 mt-0.5">
                    <div
                      className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold"
                      style={{
                        background: isCurrent ? '#C9A84C' : 'hsl(var(--muted))',
                        color:      isCurrent ? '#060E24' : 'hsl(var(--muted-foreground))',
                      }}
                    >
                      {completedCount + idx + 1}
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium leading-snug" style={{ color: 'hsl(var(--foreground))' }}>
                      {step.label}
                    </p>
                    <p className="text-xs mt-0.5 leading-relaxed text-muted-foreground">
                      {step.subtitle}
                    </p>
                  </div>
                  <svg
                    width="14" height="14" viewBox="0 0 16 16" fill="none"
                    className="flex-shrink-0 mt-1 transition-opacity opacity-0 group-hover:opacity-100"
                    style={{ color: '#C9A84C' }}
                  >
                    <path d="M6 4l4 4-4 4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </button>
              )
            })}
          </div>
        </div>

        {/* RIGHT — Video card */}
        <div
          className="rounded-xl p-5 flex flex-col justify-between"
          style={{
            background: 'hsl(var(--card))',
            border:     '1px solid hsl(var(--border)/0.6)',
          }}
        >
          <div className="flex gap-4">
            <div className="flex-1">
              <h3
                className="text-base font-semibold mb-2 leading-snug"
                style={{ fontFamily: 'Georgia, serif', color: 'hsl(var(--foreground))' }}
              >
                Master Mirror In 5 Minutes
              </h3>
              <p className="text-sm leading-relaxed text-muted-foreground">
                Want to see Mirror in action? Book a live walkthrough with our team —
                we&apos;ll show you grading, cognitive profiles, and gap attribution for your school.
              </p>
            </div>
            <button
              {...CAL_ATTRS}
              className="flex-shrink-0 relative rounded-lg overflow-hidden"
              style={{
                width:      88,
                height:     64,
                background: 'hsl(var(--muted))',
                border:     '1px solid hsl(var(--border))',
                transition: 'transform 0.2s, box-shadow 0.2s',
              }}
              onMouseEnter={e => {
                e.currentTarget.style.transform = 'scale(1.05)'
                e.currentTarget.style.boxShadow = '0 4px 16px rgba(201,168,76,0.2)'
              }}
              onMouseLeave={e => {
                e.currentTarget.style.transform = 'scale(1)'
                e.currentTarget.style.boxShadow = 'none'
              }}
            >
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background: '#C9A84C' }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#060E24" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                    <line x1="16" y1="2" x2="16" y2="6"/>
                    <line x1="8" y1="2" x2="8" y2="6"/>
                    <line x1="3" y1="10" x2="21" y2="10"/>
                  </svg>
                </div>
              </div>
            </button>
          </div>
          <button
            {...CAL_ATTRS}
            className="mt-4 w-full py-2.5 rounded-lg text-sm font-semibold transition-all"
            style={{ background: '#C9A84C', color: '#060E24' }}
            onMouseEnter={e => (e.currentTarget.style.background = '#E8C96A')}
            onMouseLeave={e => (e.currentTarget.style.background = '#C9A84C')}
          >
            Schedule a Demo
          </button>
        </div>
      </div>
    </>
  )
}