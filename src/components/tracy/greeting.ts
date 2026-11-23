// A warm, time-aware greeting for an empty Tracy chat — in the spirit of Claude's
// "Good evening, Sam": it says hello by the clock and, when it can, notices
// something real about the student (a study streak) instead of a generic banner.
// Pure and deterministic for a given (name, time, streak, day) so it never
// flickers on re-render and is easy to test.

export interface Greeting {
  headline: string
  subline: string
}

const pick = <T,>(items: T[], seed: number): T => items[Math.abs(seed) % items.length]

export function buildGreeting(opts: { name?: string | null; now?: Date; streak?: number | null }): Greeting {
  const now = opts.now ?? new Date()
  const hour = now.getHours()
  const first = opts.name?.trim().split(/\s+/)[0] || ''
  // Changes once a day, so the wording is fresh tomorrow but steady today.
  const day = Math.floor(now.getTime() / 86_400_000)
  const named = (s: string) => (first ? `${s}, ${first}` : s)

  let headline: string
  let sublines: string[]

  if (hour >= 5 && hour < 12) {
    headline = named(pick(['Good morning', 'Morning'], day))
    sublines = ['A fresh head is a good time to learn something new.', 'What shall we tackle first today?']
  } else if (hour >= 12 && hour < 17) {
    headline = named(pick(['Good afternoon', 'Afternoon'], day))
    sublines = ['Keep the momentum going — what’s next?', 'What would you like to work on?']
  } else if (hour >= 17 && hour < 21) {
    headline = named(pick(['Good evening', 'Evening'], day))
    sublines = ['A good time to go over today’s work.', 'What would you like to revise tonight?']
  } else {
    headline = first ? `Still up, ${first}?` : 'Still up?'
    sublines = ['Let’s keep it short and sharp, then rest.', 'A quick revision before sleep sticks well.']
  }

  const streak = opts.streak ?? 0
  const subline =
    streak >= 3
      ? `${streak}-day study streak — let’s keep it going.`
      : pick(sublines, day + 1)

  return { headline, subline }
}
