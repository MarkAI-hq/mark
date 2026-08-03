// Hand-built SVG mascot for the study streak ("Ember") — no external asset
// pipeline, themes correctly, and stays on the platform's existing gold/amber
// palette instead of introducing a new brand color. Mood shifts with streak
// health so it reads as a companion, not just a counter (item 8).

export type MascotMood = 'sleepy' | 'content' | 'proud' | 'ecstatic'

export function moodForStreak(days: number): MascotMood {
  if (days <= 0) return 'sleepy'
  if (days < 7) return 'content'
  if (days < 30) return 'proud'
  return 'ecstatic'
}

const FACE: Record<MascotMood, { eye: string; mouth: string; cheeks: boolean }> = {
  sleepy:   { eye: 'M 38 46 q 4 3 8 0',       mouth: 'M 42 58 q 6 2 12 0',  cheeks: false },
  content:  { eye: 'circle',                   mouth: 'M 40 56 q 8 6 16 0', cheeks: false },
  proud:    { eye: 'circle',                   mouth: 'M 39 55 q 9 8 18 0', cheeks: true },
  ecstatic: { eye: 'star',                      mouth: 'M 38 54 q 10 10 20 0', cheeks: true },
}

export function StreakMascot({
  mood = 'content',
  size = 40,
  className,
}: {
  mood?: MascotMood
  size?: number
  className?: string
}) {
  const face = FACE[mood]

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 96 96"
      className={className}
      role="img"
      aria-label={`Ember, feeling ${mood}`}
    >
      {/* Flame body */}
      <path
        d="M48 8
           C 30 26, 20 40, 20 58
           C 20 76, 33 88, 48 88
           C 63 88, 76 76, 76 58
           C 76 44, 68 34, 62 26
           C 62 36, 56 40, 52 36
           C 48 32, 50 20, 48 8 Z"
        fill="url(#emberGradient)"
      />
      <defs>
        <linearGradient id="emberGradient" x1="20" y1="8" x2="76" y2="88" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#f6c453" />
          <stop offset="0.55" stopColor="#e08a2e" />
          <stop offset="1" stopColor="#c9601f" />
        </linearGradient>
      </defs>

      {/* Inner glow */}
      <path
        d="M48 34
           C 40 44, 36 52, 36 60
           C 36 70, 41 76, 48 76
           C 55 76, 60 70, 60 60
           C 60 52, 56 44, 48 34 Z"
        fill="#fff2cf"
        opacity={0.55}
      />

      {/* Cheeks */}
      {face.cheeks && (
        <>
          <circle cx="34" cy="58" r="4" fill="#e8552c" opacity={0.5} />
          <circle cx="62" cy="58" r="4" fill="#e8552c" opacity={0.5} />
        </>
      )}

      {/* Eyes */}
      {face.eye === 'circle' && (
        <>
          <circle cx="40" cy="52" r="3.4" fill="#3a2211" />
          <circle cx="56" cy="52" r="3.4" fill="#3a2211" />
        </>
      )}
      {face.eye === 'star' && (
        <>
          <path d="M40 47 l1.6 3.8 4 .4-3 2.8.9 4-3.5-2.2-3.5 2.2.9-4-3-2.8 4-.4Z" fill="#3a2211" />
          <path d="M56 47 l1.6 3.8 4 .4-3 2.8.9 4-3.5-2.2-3.5 2.2.9-4-3-2.8 4-.4Z" fill="#3a2211" />
        </>
      )}
      {face.eye === 'M 38 46 q 4 3 8 0' && (
        <>
          <path d={face.eye} stroke="#3a2211" strokeWidth="2.4" fill="none" strokeLinecap="round" />
          <path d="M 50 46 q 4 3 8 0" stroke="#3a2211" strokeWidth="2.4" fill="none" strokeLinecap="round" />
        </>
      )}

      {/* Mouth */}
      <path d={face.mouth} stroke="#3a2211" strokeWidth="2.4" fill="none" strokeLinecap="round" />
    </svg>
  )
}
