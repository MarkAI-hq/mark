'use client'

// src/components/students/guided-tour.tsx
//
// A first-run tour for new students — 7 steps highlighting the dashboard's
// most useful elements (checklist item 3).
//
// This only ever auto-starts right after onboarding actually completes — the
// dashboard redirect in finish-setup-client.tsx / join-client.tsx appends
// `?tour=welcome`, which the dashboard page reads server-side and passes down
// as `trigger="welcome"`. A plain, everyday dashboard visit carries no such
// param, so an existing student never sees it, even from a fresh browser or
// after clearing storage — this is NOT the same as "hasn't seen it in
// localStorage yet" (that would also fire for an old user on a new device).
// `trigger="replay"` is the other path in — an explicit "Retake the tour"
// action from the Help page (or the completion toast below), which
// force-starts regardless of prior completion.
//
// Candidate steps are filtered against what's actually in the DOM before
// starting: NextStep and StreakBadge both legitimately render nothing for
// some student states (no class yet assigned, zero-day streak) — targeting a
// selector that will never appear would leave tourguidejs waiting forever on
// that step (it watches for the element via MutationObserver with no
// timeout), so a step whose target isn't present gets dropped instead.
//
// Branding/theme: the library ships fixed light-mode colors with no theme
// hook — see guided-tour-theme.css (imported in the portal layout) for the
// override that maps every visible surface onto the app's own light/dark
// CSS variables and gold accent instead.

import { useEffect, useRef } from 'react'
import { PartyPopper } from 'lucide-react'
import { TourGuideClient } from '@sjmc11/tourguidejs'
import { toast } from 'sonner'
import { useCelebration } from '@/hooks/use-celebration'
// CSS is imported in the portal layout (src/app/student/(portal)/layout.tsx),
// not here — this component only mounts on the dashboard, so a client-side
// <Link> transition into it (e.g. Help page's "Retake the tour") wouldn't
// have this stylesheet loaded yet if it were imported here instead, and the
// tour would render completely unstyled (dialog collapses to zero height,
// looks empty even though its title/content text is genuinely there).
// Importing it in the always-loaded portal layout avoids that entirely.

const TOUR_GROUP = 'student-dashboard-intro'

// A function, not a shared constant array: tourguidejs's computeTourSteps
// mutates each step object in place (replacing a string `target` selector
// with the resolved live DOM element) the first time a tour runs. Reusing
// the same objects on a second run — e.g. the Help page's "Retake the tour"
// link is a client-side <Link>, which doesn't reload the JS module and so
// doesn't recreate a module-level constant — would hand the library stale,
// detached elements from the previous page render instead of re-resolving
// the current selectors, breaking positioning and dialog content silently.
function candidateSteps() {
  return [
    {
      target: '[data-tour="next-step"]',
      title: 'Start here',
      content: 'This is the one thing we recommend right now — picked from your gradebook and where your class is in the term, so you never have to guess what to study.',
      order: 1,
      group: TOUR_GROUP,
    },
    {
      target: 'a[href="/student/subjects"]',
      title: 'Browse by subject',
      content: 'Every subject you\'re enrolled in, with your mastery level at a glance.',
      order: 2,
      group: TOUR_GROUP,
    },
    {
      target: 'a[href="/student/study-plans"]',
      title: 'Your lessons',
      content: 'Every personalised lesson lives here — search, review, and pick up right where you left off.',
      order: 3,
      group: TOUR_GROUP,
    },
    {
      target: 'a[href="/student/schedule"]',
      title: 'Your week at a glance',
      content: 'Timetable, upcoming topics, and attendance — all in one place.',
      order: 4,
      group: TOUR_GROUP,
    },
    {
      target: 'a[href="/student/grades"]',
      title: 'Track your marks',
      content: 'See how you\'re doing per subject, and how close you are to your target grade.',
      order: 5,
      group: TOUR_GROUP,
    },
    {
      target: 'a[href="/student/tracy"]',
      title: 'Ask Tracy',
      content: 'Stuck on something? Tracy is your AI study buddy — ask anything, any time.',
      order: 6,
      group: TOUR_GROUP,
    },
    {
      target: '[data-tour="streak-badge"]',
      title: 'Keep your streak',
      content: 'Study every day to keep this streak alive — miss a day and it resets.',
      order: 7,
      group: TOUR_GROUP,
    },
  ]
}

export function GuidedTour({ trigger }: { trigger: 'welcome' | 'replay' | null }) {
  // TourGuideClient's constructor creates its dialog/backdrop DOM nodes
  // immediately and asynchronously populates them, before .start() is ever
  // called. React Strict Mode double-invokes effects in dev (mount →
  // cleanup → mount, synchronously) — a plain local variable or module
  // constant gets reset/recreated on each invocation, but this ref's value
  // survives across that synchronous cycle, so it reliably tells the second
  // invocation "this trigger was already handled" and stops it constructing
  // a second, independent TourGuideClient. Without this guard, both
  // instances' dialogs end up in the DOM — one real and positioned, one a
  // stale, empty, unstyled leftover — and which one a student (or a DOM
  // query) actually sees becomes a race.
  const startedForRef = useRef<string | null>(null)
  const { celebrate } = useCelebration()

  useEffect(() => {
    if (!trigger || startedForRef.current === trigger) return
    startedForRef.current = trigger

    // Strip the trigger param unconditionally and immediately, whether or not
    // the tour ends up running below — a stale `?tour=welcome`/`?tour=replay`
    // (bookmarked, already-finished, or nothing to show) shouldn't linger in
    // the address bar. Uses the raw History API, not next/navigation's
    // router — router.replace() triggers a server re-render with the new
    // (paramless) searchParams, which flips this component's `trigger` prop
    // back to null and tears the tour down via this effect's own cleanup
    // before it ever gets on screen. history.replaceState only touches the
    // address bar and is invisible to React.
    window.history.replaceState(null, '', '/student/dashboard')

    const availableSteps = candidateSteps().filter((s) => document.querySelector(s.target))
    if (availableSteps.length === 0) return

    // exitOnClickOutside is the library default (true) — off here because it
    // combines badly with "mark seen on any exit" below: a single stray tap
    // near the dialog's edge (easy on a first-run tour where the student is
    // still getting oriented) would silently and permanently dismiss it with
    // no confirmation. Closing now requires the explicit X button or Esc.
    const tg = new TourGuideClient({ steps: availableSteps, exitOnClickOutside: false })

    // "welcome" still respects prior completion (e.g. a double-fired
    // redirect) — "replay" is an explicit request and always runs.
    if (trigger === 'welcome' && tg.isFinished(TOUR_GROUP)) return

    // Tracks whether the student ever actually reached the final step, so
    // the completion celebration only fires for a genuine finish — not for
    // closing on step 2 of 7. onBeforeExit (below) fires on every exit path
    // (Finish, X button, Esc), so this has to be captured separately, ahead
    // of time, rather than inferred from how the tour ended.
    let reachedLastStep = false
    tg.onAfterStepChange(() => {
      if (tg.activeStep >= tg.tourSteps.length - 1) reachedLastStep = true
    })

    // The library only marks a tour "seen" (in localStorage) when a student
    // clicks through to the last step — dismissing early (close button, Esc)
    // leaves it unmarked, which would nag them again on their next visit.
    // Mark it seen on any exit, not just full completion.
    tg.onBeforeExit(() => { tg.finishTour(false, TOUR_GROUP) })

    tg.onAfterExit(() => {
      if (!reachedLastStep) return
      celebrate('milestone')
      // toast.success's default look is sonner's generic green (the app's
      // root Toaster has richColors on) — fine for an ordinary confirmation,
      // but this is a celebration, so it gets the app's own theme + gold
      // accent instead, matching the confetti and the tour dialog's own
      // branding. richColors sets background/color via a plain (non-
      // !important) CSS rule, so an explicit `style` here — which always
      // wins over a stylesheet rule of any specificity short of !important —
      // is enough to override it. actionButtonStyle must be a top-level
      // option (a sibling of `action`), not nested inside it — sonner reads
      // `toast.actionButtonStyle`, not `action.actionButtonStyle`, despite
      // the latter appearing on the `Action` type too.
      toast.success('Nice! You know your way around now.', {
        icon: <PartyPopper className="h-4 w-4 text-gold" />,
        description: 'Want to see the walkthrough again sometime?',
        style: {
          background: 'hsl(var(--card))',
          color: 'hsl(var(--card-foreground))',
          borderColor: 'hsl(var(--gold) / 0.4)',
        },
        action: {
          label: 'Take it again',
          onClick: () => { window.location.href = '/student/dashboard?tour=replay' },
        },
        actionButtonStyle: { background: 'hsl(var(--gold))', color: 'hsl(var(--gold-foreground))' },
        duration: 8000,
      })
    })

    // Cleanup only clears the pending start — it must NOT call tg.exit(),
    // since onBeforeExit (above) marks the tour "seen". React's Strict Mode
    // double-invokes effects in dev (mount → cleanup → mount), and a real
    // page navigation away tears down this component's DOM anyway — either
    // way, calling exit() here would wrongly mark the tour finished before a
    // student ever saw it.
    const timer = setTimeout(() => tg.start(TOUR_GROUP), 600)
    return () => clearTimeout(timer)
  }, [trigger, celebrate])

  return null
}
