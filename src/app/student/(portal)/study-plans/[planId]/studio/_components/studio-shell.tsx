'use client'

import { useState, useCallback, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import {
  ChevronLeft, ChevronRight, X, CheckCircle2, Volume2, VolumeX, VolumeOff, Lock, Trophy, TrendingUp,
} from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { NextStep } from '@/components/students/next-step'
import { getNextAction, type NextAction } from '@/lib/actions/student-dashboard'
import { SceneSlide }                   from './scene-slide'
import { SceneQuiz }                    from './scene-quiz'
import { SceneSimulation }              from './scene-simulation'
import { SceneWhiteboard }              from './scene-whiteboard'
import { ScenePbl }                     from './scene-pbl'
import { SceneCornell }                 from './scene-cornell'
import { SceneHintQuiz }                from './scene-hint-quiz'
import { SceneProbe }                   from './scene-probe'
import { SceneMisconceptionRedirect }   from './scene-misconception-redirect'
import { ScenePeerTeach }               from './scene-peer-teach'
import { SceneMasteryMoment }           from './scene-mastery-moment'
import { ScenePhenomenon }              from './scene-phenomenon'
import { SceneRetrievalFlash }          from './scene-retrieval-flash'
import { SceneOutcomesIntro }           from './scene-outcomes-intro'
import { SceneOutcomesCheck }           from './scene-outcomes-check'
import { markStudyPlanComplete } from '@/lib/actions/study-plans'

// ── 5E Stage config ───────────────────────────────────────────────────────────

type FiveEStage = 'Engage' | 'Explore' | 'Explain' | 'Apply' | 'Elaborate' | 'Evaluate'

const STAGE_CONFIG: Record<FiveEStage, { bg: string; text: string }> = {
  Engage:    { bg: 'bg-amber-100  dark:bg-amber-900/40',  text: 'text-amber-800  dark:text-amber-300' },
  Explore:   { bg: 'bg-teal-100   dark:bg-teal-900/40',   text: 'text-teal-800   dark:text-teal-300' },
  Explain:   { bg: 'bg-blue-100   dark:bg-blue-900/40',   text: 'text-blue-800   dark:text-blue-300' },
  Apply:     { bg: 'bg-purple-100 dark:bg-purple-900/40', text: 'text-purple-800 dark:text-purple-300' },
  Elaborate: { bg: 'bg-green-100  dark:bg-green-900/40',  text: 'text-green-800  dark:text-green-300' },
  Evaluate:  { bg: 'bg-rose-100   dark:bg-rose-900/40',   text: 'text-rose-800   dark:text-rose-300' },
}

const FALLBACK_STAGES: FiveEStage[] = ['Engage', 'Explore', 'Explain', 'Apply', 'Elaborate', 'Evaluate']

function getStage(scene: any, index: number): FiveEStage {
  if (scene?.five_e_stage && STAGE_CONFIG[scene.five_e_stage as FiveEStage]) {
    return scene.five_e_stage as FiveEStage
  }
  return FALLBACK_STAGES[index % FALLBACK_STAGES.length]
}

// Scenes that require engagement before the student can advance
const GATED_TYPES = new Set([
  'quiz', 'hint_quiz', 'probe', 'peer_teach',
  'whiteboard', 'cornell_notes', 'phenomenon_story', 'retrieval_flash',
  'outcomes_check',
])

function requiresGate(scene: any): boolean {
  return GATED_TYPES.has(scene?.type)
}

// ── Component ─────────────────────────────────────────────────────────────────

interface Props {
  plan:   any
  scenes: any[]
  user:   any
}

export function StudioShell({ plan, scenes, user }: Props) {
  const router = useRouter()
  const [currentIndex, setCurrentIndex] = useState(0)
  const [completing, setCompleting]     = useState(false)
  const [audioPlaying, setAudioPlaying] = useState(false)
  const [animKey, setAnimKey]           = useState(0)
  const [sceneReady, setSceneReady]     = useState(() => !requiresGate(scenes[0]))
  // Probe routing: tracks indices where probe was answered correctly → skip next skip_if_probe_correct scene
  const [probeCorrectAt, setProbeCorrectAt] = useState<Set<number>>(new Set())
  const [initialMisconception, setInitialMisconception] = useState<string | null>(null)
  // Outcomes: refs of outcomes_check items answered correctly; populated on submit
  const [achievedRefs, setAchievedRefs] = useState<string[]>([])
  // Scene responses for server-side score computation
  const [sceneResponses, setSceneResponses] = useState<{ type: string; correct?: boolean }[]>([])
  // Completion screen: outcome of this lesson + the immediate next action (no dead air).
  const [done, setDone] = useState<{
    predicted_grade?: string | null
    trajectory?: string | null
    next: NextAction | null
  } | null>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)

  // Whether the scene at a given index should be skipped (probe routing)
  function isSkipped(idx: number): boolean {
    if (!scenes[idx]?.skip_if_probe_correct) return false
    return probeCorrectAt.has(idx - 1)
  }

  const total   = scenes.length
  const scene   = scenes[currentIndex]
  const isLast  = currentIndex === total - 1
  const isFirst = currentIndex === 0
  const stage   = getStage(scene, currentIndex)
  const stageCfg = STAGE_CONFIG[stage]
  const progressPct = total > 0 ? ((currentIndex + 1) / total) * 100 : 100

  const handleComplete = useCallback(async () => {
    setCompleting(true)
    try {
      const res = await markStudyPlanComplete(plan.id, {
        scene_responses: sceneResponses,
        outcomes_achieved: achievedRefs,
      })
      toast.success('Lesson complete!')
      // Fetch the next action so the completion screen has no dead air.
      const next = await getNextAction().catch(() => null)
      setDone({
        predicted_grade: res?.data?.prediction?.predicted_grade ?? null,
        trajectory: res?.data?.prediction?.trajectory ?? null,
        next,
      })
    } catch {
      toast.error('Could not mark as complete. Try again.')
    } finally {
      setCompleting(false)
    }
  }, [plan.id, sceneResponses, achievedRefs])

  function navigate(to: number) {
    if (to < 0 || to >= total) return
    // Skip scenes flagged as skip_if_probe_correct when probe was answered correctly
    if (isSkipped(to)) {
      navigate(to + 1)
      return
    }
    setCurrentIndex(to)
    setAnimKey((k) => k + 1)
    // Reset gate for the incoming scene
    setSceneReady(!requiresGate(scenes[to]))
  }

  function handleProbeAnswer(correct: boolean, selectedText: string) {
    if (correct) {
      setProbeCorrectAt((prev) => new Set(prev).add(currentIndex))
    } else if (!initialMisconception) {
      setInitialMisconception(selectedText)
    }
    setSceneResponses((prev) => [...prev, { type: 'probe', correct }])
  }

  function stopAudio() {
    if (audioRef.current) {
      audioRef.current.pause()
      audioRef.current = null
    }
    // Cancel any in-flight Web Speech fallback too.
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.cancel()
    }
    setAudioPlaying(false)
  }

  // Client-side fallback when a scene has no server-synthesized audio_url
  // (TTS credits exhausted, no API key, R2 failure…). Speaks the scene's
  // tts_script via the browser's Web Speech API. Returns false if unavailable.
  function playWebSpeech(text: string): boolean {
    if (typeof window === 'undefined' || !window.speechSynthesis || !text.trim()) {
      return false
    }
    window.speechSynthesis.cancel()
    const utterance = new SpeechSynthesisUtterance(text)
    utterance.onend = () => setAudioPlaying(false)
    utterance.onerror = () => setAudioPlaying(false)
    window.speechSynthesis.speak(utterance)
    setAudioPlaying(true)
    return true
  }

  function playScene(s: any) {
    stopAudio()
    if (s?.audio_url) {
      const audio = new Audio(s.audio_url)
      audioRef.current = audio
      setAudioPlaying(true)
      audio.onended = () => setAudioPlaying(false)
      // If the file can't load/play, degrade to the Web Speech fallback.
      audio.onerror = () => { audioRef.current = null; if (!playWebSpeech(s?.tts_script ?? '')) setAudioPlaying(false) }
      audio.play().catch(() => { audioRef.current = null; if (!playWebSpeech(s?.tts_script ?? '')) setAudioPlaying(false) })
      return
    }
    playWebSpeech(s?.tts_script ?? '')
  }

  // Whether a scene can be narrated at all (server audio or client fallback text).
  function hasNarration(s: any): boolean {
    return Boolean(s?.audio_url || s?.tts_script)
  }

  function toggleAudio() {
    if (audioPlaying) { stopAudio(); return }
    if (scene && hasNarration(scene)) playScene(scene)
  }

  // Auto-play narration on Engage and Explain scenes
  useEffect(() => {
    const autoPlayStages: FiveEStage[] = ['Engage', 'Explain']
    if (scene && hasNarration(scene) && autoPlayStages.includes(getStage(scene, currentIndex))) {
      const t = setTimeout(() => playScene(scene), 400)
      return () => clearTimeout(t)
    }
    return () => stopAudio()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentIndex])

  // Completion screen — celebrate the outcome, then the immediate next action.
  if (done) {
    return (
      <div className="flex flex-col h-full p-4 overflow-y-auto">
        <div className="max-w-2xl mx-auto w-full space-y-5 py-6">
          <div className="text-center">
            <div className="mx-auto h-14 w-14 rounded-full bg-emerald-100 dark:bg-emerald-900/40 flex items-center justify-center mb-3">
              <Trophy className="h-7 w-7 text-emerald-600" />
            </div>
            <h2 className="text-xl font-bold">Lesson complete!</h2>
            <p className="text-sm text-muted-foreground mt-1">{plan.subject}: {plan.topic}</p>
            {done.predicted_grade && (
              <div className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-gold/10 border border-gold/30 px-3 py-1 text-xs font-medium">
                <TrendingUp className="h-3.5 w-3.5 text-gold" />
                Predicted grade now {done.predicted_grade}
                {done.trajectory ? ` · ${done.trajectory}` : ''}
              </div>
            )}
          </div>

          {/* The immediate next action — no dead air */}
          <NextStep nextAction={done.next} />

          <div className="flex items-center justify-center gap-2">
            <Button asChild variant="outline" size="sm">
              <Link href="/student/dashboard">Back to dashboard</Link>
            </Button>
            <Button asChild variant="ghost" size="sm">
              <Link href="/student/study-plans">All lessons</Link>
            </Button>
          </div>
        </div>
      </div>
    )
  }

  // No-scenes fallback
  if (scenes.length === 0) {
    return (
      <div className="flex flex-col h-full p-4 space-y-4">
        <Button variant="ghost" size="sm" onClick={() => router.back()} className="w-fit gap-1">
          <X className="h-4 w-4" /> Exit
        </Button>
        <div className="rounded-2xl border bg-card p-6 max-w-2xl mx-auto w-full">
          <h2 className="font-bold text-xl">{plan.topic}</h2>
          <p className="text-sm text-muted-foreground mt-1">{plan.subject}</p>
          <div className="mt-4 space-y-3 text-sm text-foreground/80 leading-relaxed">
            <p>{plan.content?.introduction}</p>
            <p>{plan.content?.explanation}</p>
          </div>
          <Button className="mt-6 bg-gold hover:bg-gold/90 text-gold-foreground" onClick={handleComplete} disabled={completing}>
            {completing ? 'Completing…' : 'Mark as Complete'}
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full bg-background overflow-hidden">
      {/* ── Thin progress bar ───────────────────────────────────────────── */}
      <div className="h-0.5 bg-border shrink-0">
        <div
          className="h-full bg-gold transition-all duration-500 ease-out"
          style={{ width: `${progressPct}%` }}
        />
      </div>

      {/* ── Top bar ─────────────────────────────────────────────────────── */}
      <div className="flex items-center h-11 px-4 gap-3 border-b shrink-0">
        <button
          onClick={() => router.back()}
          className="flex items-center justify-center h-7 w-7 rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="flex-1 flex items-center justify-center gap-2 min-w-0">
          <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${stageCfg.bg} ${stageCfg.text}`}>
            {stage}
          </span>
          <span className="text-xs text-muted-foreground truncate max-w-[200px]">{scene?.title ?? plan.topic}</span>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[11px] text-muted-foreground tabular-nums">{currentIndex + 1}/{total}</span>
          {scene && hasNarration(scene) ? (
            <button
              onClick={toggleAudio}
              title={scene?.audio_url ? 'Play narration' : 'Play narration (browser voice)'}
              className="flex items-center justify-center h-7 w-7 rounded-lg hover:bg-muted transition-colors"
            >
              {audioPlaying
                ? <VolumeX className="h-4 w-4 text-gold" />
                : <Volume2 className="h-4 w-4 text-muted-foreground" />}
            </button>
          ) : (
            <span title="Audio unavailable" className="flex items-center justify-center h-7 w-7 opacity-30 cursor-default">
              <VolumeOff className="h-4 w-4 text-muted-foreground" />
            </span>
          )}
        </div>
      </div>

      {/* ── Scene content ────────────────────────────────────────────────── */}
      <div className="flex-1 min-h-0 overflow-y-auto">
        <div
          key={animKey}
          className="animate-in fade-in slide-in-from-right-4 duration-300 h-full"
        >
          <div className="mx-auto w-full max-w-2xl px-4 py-6">
            {/* Image: slide scenes own their image layout (2-col); all others get centered image above */}
            {scene?.image_url && scene.type !== 'slide' && (
              <div className="flex justify-center mb-5">
                <img
                  src={scene.image_url}
                  alt={scene.title ?? 'Scene image'}
                  className="rounded-2xl object-contain max-h-52 max-w-full"
                  loading="lazy"
                  onError={(e) => { (e.currentTarget.parentElement as HTMLElement).style.display = 'none' }}
                />
              </div>
            )}

            {scene && (
              <>
                {scene.type === 'slide'                   && <SceneSlide                 scene={scene} imageUrl={scene.image_url} />}
                {scene.type === 'quiz'                    && <SceneQuiz                  scene={scene} onReady={() => setSceneReady(true)} />}
                {scene.type === 'simulation'              && <SceneSimulation            scene={scene} />}
                {scene.type === 'whiteboard'              && <SceneWhiteboard            scene={scene} planId={plan.id} subject={plan.subject ?? ''} topic={plan.topic ?? ''} onReady={() => setSceneReady(true)} />}
                {scene.type === 'pbl_stage'               && <ScenePbl                   scene={scene} />}
                {scene.type === 'cornell_notes'           && <SceneCornell               scene={scene} planId={plan.id} subject={plan.subject ?? ''} topic={plan.topic ?? ''} onReady={() => setSceneReady(true)} />}
                {scene.type === 'hint_quiz'               && <SceneHintQuiz              scene={scene} onReady={() => setSceneReady(true)} />}
                {scene.type === 'probe'                   && <SceneProbe                 scene={scene} onAnswer={handleProbeAnswer} onReady={() => setSceneReady(true)} />}
                {scene.type === 'misconception_redirect'  && <SceneMisconceptionRedirect scene={scene} />}
                {scene.type === 'peer_teach'              && <ScenePeerTeach             scene={scene} onReady={() => setSceneReady(true)} />}
                {scene.type === 'mastery_moment'          && <SceneMasteryMoment         scene={scene} initialMisconception={initialMisconception ?? undefined} />}
                {scene.type === 'phenomenon_story'        && <ScenePhenomenon            scene={scene} onReady={() => setSceneReady(true)} />}
                {scene.type === 'retrieval_flash'         && <SceneRetrievalFlash        scene={scene} onReady={() => setSceneReady(true)} />}
                {scene.type === 'outcomes_intro'          && <SceneOutcomesIntro         scene={scene} />}
                {scene.type === 'outcomes_check'          && <SceneOutcomesCheck         scene={scene} onReady={() => setSceneReady(true)} onOutcomesAchieved={setAchievedRefs} />}
              </>
            )}

            {/* Auto-play indicator */}
            {audioPlaying && (
              <div className="mt-4 flex items-center gap-1.5 text-[11px] text-gold">
                <span className="h-1.5 w-1.5 rounded-full bg-gold animate-pulse" />
                Playing audio…
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Bottom nav ───────────────────────────────────────────────────── */}
      <div className="flex items-center h-16 px-4 border-t gap-4 shrink-0">
        <Button
          variant="outline"
          size="sm"
          onClick={() => navigate(currentIndex - 1)}
          disabled={isFirst}
          className="gap-1"
        >
          <ChevronLeft className="h-4 w-4" /> Back
        </Button>

        <div className="flex-1 flex justify-center gap-1.5">
          {scenes.map((_, i) => (
            <button
              key={i}
              onClick={() => navigate(i)}
              className={`rounded-full transition-all duration-200 ${
                i === currentIndex
                  ? 'h-2 w-4 bg-gold'
                  : i < currentIndex
                  ? 'h-2 w-2 bg-gold/40'
                  : 'h-2 w-2 bg-muted-foreground/25'
              }`}
            />
          ))}
        </div>

        {isLast ? (
          <Button
            size="sm"
            className="gap-1 bg-gold hover:bg-gold/90 text-gold-foreground"
            onClick={handleComplete}
            disabled={completing || !sceneReady}
            title={!sceneReady ? 'Complete this activity first' : undefined}
          >
            <CheckCircle2 className="h-4 w-4" />
            {completing ? 'Saving…' : 'Complete'}
          </Button>
        ) : (
          <Button
            size="sm"
            className="gap-1"
            onClick={() => navigate(currentIndex + 1)}
            disabled={!sceneReady}
            title={!sceneReady ? 'Complete this activity first' : undefined}
          >
            {!sceneReady
              ? <><Lock className="h-3.5 w-3.5" /> Next</>
              : <>Next <ChevronRight className="h-4 w-4" /></>
            }
          </Button>
        )}
      </div>
    </div>
  )
}
