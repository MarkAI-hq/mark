'use client'

import { useState, useCallback, useEffect, useRef } from 'react'
import {
  ChevronLeft, ChevronRight, X, CheckCircle2, Volume2, VolumeX, VolumeOff, Lock,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
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

import { useKeyboardBlocker } from '@/lib/utils/validation'

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

// Gated Scene Types
// Adding 'pbl_stage' to GATED_TYPES enforces active response submission [1].
const GATED_TYPES = new Set([
  'quiz', 'hint_quiz', 'probe', 'peer_teach', 'pbl_stage',
  'whiteboard', 'cornell_notes', 'phenomenon_story', 'retrieval_flash',
  'outcomes_check',
])

function requiresGate(scene: any): boolean {
  return GATED_TYPES.has(scene?.type)
}

export interface SceneResponse { type: string; correct?: boolean }

interface LessonPlayerProps {
  scenes: any[]
  subject?: string
  topic?: string
  planId?: string
  completeLabel?: string
  onComplete?: (data: {
    sceneResponses: SceneResponse[]
    achievedRefs: string[]
  }) => void | Promise<void>
  onExit?: () => void
  sessionHint?: { index: number; of_estimate: number }
}

export function LessonPlayer({
  scenes,
  subject = '',
  topic = '',
  planId = '',
  completeLabel = 'Complete',
  onComplete,
  onExit,
  sessionHint,
}: LessonPlayerProps) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [completing, setCompleting]     = useState(false)
  const [audioPlaying, setAudioPlaying] = useState(false)
  const [animKey, setAnimKey]           = useState(0)
  const [sceneReady, setSceneReady]     = useState(() => !requiresGate(scenes[0]))
  const [probeCorrectAt, setProbeCorrectAt] = useState<Set<number>>(new Set())
  const [initialMisconception, setInitialMisconception] = useState<string | null>(null)
  const [achievedRefs, setAchievedRefs] = useState<string[]>([])
  const [sceneResponses, setSceneResponses] = useState<SceneResponse[]>([])
  const audioRef = useRef<HTMLAudioElement | null>(null)

  // Keyboard locks [4]
  useKeyboardBlocker()

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

  const finish = useCallback(async () => {
    setCompleting(true)
    try {
      await onComplete?.({ sceneResponses, achievedRefs })
    } finally {
      setCompleting(false)
    }
  }, [onComplete, sceneResponses, achievedRefs])

  function navigate(to: number) {
    if (to < 0 || to >= total) return
    if (isSkipped(to)) {
      navigate(to + 1)
      return
    }
    setCurrentIndex(to)
    setAnimKey((k) => k + 1)
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
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.cancel()
    }
    setAudioPlaying(false)
  }

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

// ── Locate this function inside lesson-player.tsx ──────────────────────────
  function playScene(s: any) {
    stopAudio()

    // Heuristic: Check if the student has enabled Data Saver Mode [1]
    const isDataSaver = typeof window !== 'undefined' && localStorage.getItem('data_saver_mode') === 'true'

    // If data saver is active, skip streaming heavy server audio files and jump to local fallback [1]
    if (s?.audio_url && !isDataSaver) {
      const audio = new Audio(s.audio_url)
      audioRef.current = audio
      setAudioPlaying(true)
      audio.onended = () => setAudioPlaying(false)
      audio.onerror = () => { 
        audioRef.current = null; 
        if (!playWebSpeech(s?.tts_script ?? '')) setAudioPlaying(false) 
      }
      audio.play().catch(() => { 
        audioRef.current = null; 
        if (!playWebSpeech(s?.tts_script ?? '')) setAudioPlaying(false) 
      } )
      return
    }

    // Default or Data-Saver: Run local, zero-byte Web Speech narration fallback [1]
    playWebSpeech(s?.tts_script ?? '')
  }

  function hasNarration(s: any): boolean {
    return Boolean(s?.audio_url || s?.tts_script)
  }

  function toggleAudio() {
    if (audioPlaying) { stopAudio(); return }
    if (scene && hasNarration(scene)) playScene(scene)
  }

  useEffect(() => {
    const autoPlayStages: FiveEStage[] = ['Engage', 'Explain']
    if (scene && hasNarration(scene) && autoPlayStages.includes(getStage(scene, currentIndex))) {
      const t = setTimeout(() => playScene(scene), 400)
      return () => clearTimeout(t)
    }
    return () => stopAudio()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentIndex])

  if (scenes.length === 0) return null

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
        {onExit ? (
          <button
            onClick={onExit}
            className="flex items-center justify-center h-7 w-7 rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        ) : (
          <span className="h-7 w-7" />
        )}

        <div className="flex-1 flex items-center justify-center gap-2 min-w-0">
          <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${stageCfg.bg} ${stageCfg.text}`}>
            {stage}
          </span>
          <span className="text-xs text-muted-foreground truncate max-w-[200px]">{scene?.title ?? topic}</span>
          {sessionHint && sessionHint.of_estimate > 1 && (
            <span className="text-[10px] text-muted-foreground/70 shrink-0 whitespace-nowrap">
              Session {sessionHint.index} of ~{sessionHint.of_estimate}
            </span>
          )}
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
                {scene.type === 'whiteboard'              && <SceneWhiteboard            scene={scene} planId={planId} subject={subject} topic={topic} onReady={() => setSceneReady(true)} />}
                {/* Passed onReady handler directly to ScenePbl */}
                {scene.type === 'pbl_stage'               && <ScenePbl                   scene={scene} onReady={() => setSceneReady(true)} />}
                {scene.type === 'cornell_notes'           && <SceneCornell               scene={scene} planId={planId} subject={subject} topic={topic} onReady={() => setSceneReady(true)} />}
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
            onClick={finish}
            disabled={completing || !sceneReady}
            title={!sceneReady ? 'Complete this activity first' : undefined}
          >
            <CheckCircle2 className="h-4 w-4" />
            {completing ? 'Saving…' : completeLabel}
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