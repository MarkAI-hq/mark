'use client'

// In-chat viewer for Tracy Studio artifacts. Opens over the chat (dialog on
// desktop, full screen on phones) and closes back to exactly where the student
// was — the chat never navigates away. One viewer per artifact type:
//   flashcards  → flip cards, "Got it / Again" self-check, reshuffle the misses
//   quiz        → answer each question, instant explanation, score at the end
//   slide_deck  → step through slides
//   study_guide → readable revision sheet with key terms

import { useMemo, useState } from 'react'
import { ChevronLeft, ChevronRight, RotateCcw, Check, X, Loader2, RefreshCw, Shuffle } from 'lucide-react'
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import type { StudioContent, StudioType } from '@/lib/actions/assistant'

export interface ViewerState {
  title: string
  type: StudioType
  sourceLabels: string[]
  /** null while loading; 'legacy' = an old lesson-based artifact with nothing to show inline. */
  content: StudioContent | null | 'legacy'
}

export function StudioArtifactViewer({
  state,
  onClose,
  onRebuild,
  rebuilding,
}: {
  state: ViewerState | null
  onClose: () => void
  onRebuild: () => void
  rebuilding: boolean
}) {
  return (
    <Dialog open={!!state} onOpenChange={(o) => !o && onClose()}>
      <DialogContent
        className={cn(
          'flex flex-col gap-0 overflow-hidden p-0',
          // phones: full screen; sm+: a large centred panel
          'h-[100dvh] max-h-[100dvh] max-w-none rounded-none sm:h-auto sm:max-h-[88vh] sm:max-w-2xl sm:rounded-xl',
        )}
      >
        {state && (
          <>
            <div className="border-b px-5 py-4 pr-12">
              <DialogTitle className="text-base font-semibold leading-snug [overflow-wrap:anywhere]">{state.title}</DialogTitle>
              <DialogDescription className="mt-0.5 truncate text-xs">
                {state.sourceLabels.length ? `From your notes: ${state.sourceLabels.join(', ')}` : 'From your notes'}
              </DialogDescription>
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5 [overflow-wrap:anywhere]">
              {state.content === null && (
                <div className="flex h-40 items-center justify-center text-sm text-muted-foreground">
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Opening…
                </div>
              )}
              {state.content === 'legacy' && (
                <div className="mx-auto max-w-sm space-y-3 py-8 text-center">
                  <p className="text-sm">
                    This was made with an older version of Studio that built a full lesson instead of {label(state.type)}.
                  </p>
                  <p className="text-xs text-muted-foreground">Rebuild it from the same notes — it opens right here.</p>
                  <Button onClick={onRebuild} disabled={rebuilding} className="gap-1.5 bg-gold text-gold-foreground hover:bg-gold/90">
                    {rebuilding ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
                    {rebuilding ? 'Rebuilding…' : `Rebuild ${label(state.type)}`}
                  </Button>
                </div>
              )}
              {state.content && state.content !== 'legacy' && <Body type={state.type} content={state.content} />}
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}

function label(t: StudioType) {
  return { flashcards: 'flashcards', quiz: 'a quiz', slide_deck: 'slides', study_guide: 'a study guide' }[t]
}

function Body({ type, content }: { type: StudioType; content: StudioContent }) {
  if (type === 'flashcards' && 'cards' in content) return <Flashcards cards={content.cards} />
  if (type === 'quiz' && 'questions' in content) return <Quiz questions={content.questions} />
  if (type === 'slide_deck' && 'slides' in content) return <Slides slides={content.slides} />
  if (type === 'study_guide' && 'sections' in content) return <Guide guide={content} />
  return <p className="text-sm text-muted-foreground">This artifact couldn&apos;t be displayed.</p>
}

// ── Flashcards ───────────────────────────────────────────────────────────────

function Flashcards({ cards }: { cards: { front: string; back: string }[] }) {
  const [deck, setDeck] = useState(() => cards.map((_, i) => i))
  const [pos, setPos] = useState(0)
  const [flipped, setFlipped] = useState(false)
  const [missed, setMissed] = useState<number[]>([])
  const [known, setKnown] = useState(0)
  const done = pos >= deck.length
  const card = cards[deck[pos]]

  function answer(gotIt: boolean) {
    if (gotIt) setKnown((k) => k + 1)
    else setMissed((m) => [...m, deck[pos]])
    setFlipped(false)
    setPos((p) => p + 1)
  }
  function restart(onlyMissed: boolean) {
    const next = onlyMissed ? missed : cards.map((_, i) => i)
    setDeck([...next].sort(() => Math.random() - 0.5))
    setPos(0); setMissed([]); setKnown(0); setFlipped(false)
  }

  if (done) {
    return (
      <div className="space-y-4 py-6 text-center">
        <p className="text-lg font-semibold">{known} of {deck.length} known</p>
        <p className="text-sm text-muted-foreground">
          {missed.length ? 'Go round again on the ones you missed — repeated recall is what makes them stick.' : 'Every card recalled. Come back to them in a day or two to lock it in.'}
        </p>
        <div className="flex flex-wrap justify-center gap-2">
          {missed.length > 0 && (
            <Button onClick={() => restart(true)} className="gap-1.5 bg-gold text-gold-foreground hover:bg-gold/90">
              <RotateCcw className="h-4 w-4" /> Practise {missed.length} missed
            </Button>
          )}
          <Button variant="outline" onClick={() => restart(false)} className="gap-1.5"><Shuffle className="h-4 w-4" /> Shuffle all</Button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <p className="text-center text-xs text-muted-foreground tabular-nums">Card {pos + 1} of {deck.length}</p>
      <button
        type="button"
        onClick={() => setFlipped((f) => !f)}
        aria-label={flipped ? 'Show question' : 'Show answer'}
        className="block w-full [perspective:1200px]"
      >
        <div className={cn('relative min-h-[220px] w-full transition-transform duration-500 [transform-style:preserve-3d] motion-reduce:transition-none', flipped && '[transform:rotateY(180deg)]')}>
          <div className="absolute inset-0 flex flex-col items-center justify-center rounded-xl border bg-card p-6 text-center shadow-sm [backface-visibility:hidden]">
            <p className="text-lg font-medium leading-relaxed">{card.front}</p>
            <p className="mt-4 text-xs text-muted-foreground">Tap to reveal</p>
          </div>
          <div className="absolute inset-0 flex items-center justify-center rounded-xl border border-gold/30 bg-gold/5 p-6 text-center shadow-sm [backface-visibility:hidden] [transform:rotateY(180deg)]">
            <p className="text-base leading-relaxed">{card.back}</p>
          </div>
        </div>
      </button>
      {flipped ? (
        <div className="grid grid-cols-2 gap-2">
          <Button variant="outline" onClick={() => answer(false)} className="gap-1.5"><X className="h-4 w-4" /> Again</Button>
          <Button onClick={() => answer(true)} className="gap-1.5 bg-emerald-600 text-white hover:bg-emerald-600/90"><Check className="h-4 w-4" /> Got it</Button>
        </div>
      ) : (
        <p className="text-center text-xs text-muted-foreground">Try to answer in your head first, then tap the card.</p>
      )}
    </div>
  )
}

// ── Quiz ─────────────────────────────────────────────────────────────────────

function Quiz({ questions }: { questions: { question: string; options: string[]; correct: number; explanation: string }[] }) {
  const [i, setI] = useState(0)
  const [picked, setPicked] = useState<number | null>(null)
  const [score, setScore] = useState(0)
  const done = i >= questions.length
  const q = questions[i]

  if (done) {
    return (
      <div className="space-y-4 py-6 text-center">
        <p className="text-lg font-semibold">{score} / {questions.length}</p>
        <p className="text-sm text-muted-foreground">
          {score === questions.length ? 'Perfect — try again in a few days to make it last.' : 'Read the explanations for the ones you missed, then have another go.'}
        </p>
        <Button variant="outline" onClick={() => { setI(0); setPicked(null); setScore(0) }} className="gap-1.5">
          <RotateCcw className="h-4 w-4" /> Try again
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <p className="text-xs text-muted-foreground tabular-nums">Question {i + 1} of {questions.length}</p>
      <p className="text-base font-medium leading-relaxed">{q.question}</p>
      <div className="space-y-2">
        {q.options.map((opt, k) => {
          const isRight = picked !== null && k === q.correct
          const isWrongPick = picked === k && k !== q.correct
          return (
            <button
              key={k}
              type="button"
              disabled={picked !== null}
              onClick={() => { setPicked(k); if (k === q.correct) setScore((s) => s + 1) }}
              className={cn(
                'flex w-full items-start gap-3 rounded-lg border px-3 py-2.5 text-left text-sm transition-colors',
                picked === null && 'hover:border-gold/60 hover:bg-gold/5',
                isRight && 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/30',
                isWrongPick && 'border-red-400 bg-red-50 dark:bg-red-950/30',
              )}
            >
              <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border text-[11px] font-semibold">{String.fromCharCode(65 + k)}</span>
              <span className="min-w-0">{opt}</span>
            </button>
          )
        })}
      </div>
      {picked !== null && (
        <div className="space-y-3">
          <p className={cn('rounded-lg px-3 py-2 text-sm', picked === q.correct ? 'bg-emerald-50 text-emerald-900 dark:bg-emerald-950/30 dark:text-emerald-200' : 'bg-amber-50 text-amber-900 dark:bg-amber-950/30 dark:text-amber-200')}>
            <span className="font-semibold">{picked === q.correct ? 'Correct. ' : 'Not quite. '}</span>{q.explanation}
          </p>
          <div className="flex justify-end">
            <Button onClick={() => { setI((n) => n + 1); setPicked(null) }} className="gap-1 bg-gold text-gold-foreground hover:bg-gold/90">
              {i + 1 < questions.length ? 'Next' : 'See score'} <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}

// ── Slides ───────────────────────────────────────────────────────────────────

function Slides({ slides }: { slides: { title: string; bullets: string[]; note?: string }[] }) {
  const [i, setI] = useState(0)
  const s = slides[i]
  return (
    <div className="flex h-full flex-col gap-4">
      <div className="min-h-[240px] flex-1 rounded-xl border bg-card p-5 shadow-sm sm:p-7">
        <p className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-gold tabular-nums">Slide {i + 1} / {slides.length}</p>
        <h3 className="mb-4 text-xl font-bold leading-snug">{s.title}</h3>
        <ul className="space-y-2.5">
          {s.bullets.map((b, k) => (
            <li key={k} className="flex gap-2.5 text-[15px] leading-relaxed"><span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-gold" />{b}</li>
          ))}
        </ul>
        {s.note && <p className="mt-5 border-t pt-3 text-xs italic text-muted-foreground">{s.note}</p>}
      </div>
      <div className="flex items-center justify-between gap-2">
        <Button variant="outline" size="sm" disabled={i === 0} onClick={() => setI((n) => n - 1)} className="gap-1"><ChevronLeft className="h-4 w-4" /> Back</Button>
        <div className="flex gap-1" aria-hidden>
          {slides.map((_, k) => <span key={k} className={cn('h-1.5 rounded-full transition-all', k === i ? 'w-4 bg-gold' : 'w-1.5 bg-muted-foreground/30')} />)}
        </div>
        <Button size="sm" disabled={i === slides.length - 1} onClick={() => setI((n) => n + 1)} className="gap-1 bg-gold text-gold-foreground hover:bg-gold/90">Next <ChevronRight className="h-4 w-4" /></Button>
      </div>
    </div>
  )
}

// ── Study guide ──────────────────────────────────────────────────────────────

function Guide({ guide }: { guide: { summary: string; sections: { heading: string; points: string[] }[]; key_terms?: { term: string; meaning: string }[] } }) {
  const terms = useMemo(() => guide.key_terms ?? [], [guide.key_terms])
  return (
    <article className="space-y-5 text-sm leading-relaxed">
      <p className="rounded-lg bg-gold/5 px-4 py-3 text-[15px]">{guide.summary}</p>
      {guide.sections.map((sec, k) => (
        <section key={k}>
          <h3 className="mb-2 text-base font-semibold">{sec.heading}</h3>
          <ul className="space-y-1.5">
            {sec.points.map((p, j) => <li key={j} className="flex gap-2"><span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-foreground/50" />{p}</li>)}
          </ul>
        </section>
      ))}
      {terms.length > 0 && (
        <section>
          <h3 className="mb-2 text-base font-semibold">Key terms</h3>
          <dl className="divide-y rounded-lg border">
            {terms.map((t, k) => (
              <div key={k} className="grid gap-1 px-3 py-2 sm:grid-cols-[minmax(0,10rem)_1fr] sm:gap-3">
                <dt className="font-medium">{t.term}</dt>
                <dd className="text-muted-foreground">{t.meaning}</dd>
              </div>
            ))}
          </dl>
        </section>
      )}
    </article>
  )
}
