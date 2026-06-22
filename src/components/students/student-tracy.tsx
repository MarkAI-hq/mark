'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
  Headphones, Layers, HelpCircle, Monitor, BookOpen,
  PenLine, FileText, ImageIcon, Check,
  X, Upload, RotateCcw, Play, Pause, Plus, ArrowUp,
  Sparkles, Zap, MoreHorizontal, ChevronRight,
} from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { toast } from 'sonner'
import { ThemeToggle } from '@/components/layout/theme-toggle'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import type { StudentNote } from '@/lib/actions/student-notes'
import { submitStudentNote, uploadStudentNote } from '@/lib/actions/student-notes'
import {
  generateStudyPlanFromSources,
  generateAudioOverview,
  renameArtifact,
  createArtifactNotification,
} from '@/lib/actions/student-dashboard'
import type { SubjectProgress } from '@/lib/actions/student-dashboard'

// ── Types ─────────────────────────────────────────────────────────────────────

type StudioType = 'flashcards' | 'quiz' | 'slide_deck' | 'study_guide'
type ArtifactType = StudioType | 'audio_overview'

interface Artifact {
  id:            string
  type:          ArtifactType
  title:         string
  status:        'generating' | 'ready' | 'failed'
  plan_id?:      string
  audio_url?:    string
  sourceNoteIds: string[]
  sourceLabels:  string[]
  createdAt:     string
}

interface Message {
  id:        string
  role:      'user' | 'tracy'
  content:   string
  timestamp: Date
  isLoading?: boolean
}

interface ToolStatus {
  name:   string
  label:  string
  status: 'running' | 'done' | 'failed'
}

// ── SSE parsing helpers ───────────────────────────────────────────────────────

const ARTIFACT_RE = /(?:^|\n)(?:__)?ARTIFACT(?:__)?\s*:\s*(\{[\s\S]*)/
const CONFIRM_RE  = /(?:^|\n)(?:__)?CONFIRM(?:__)?\s*:\s*(\{[\s\S]*)/
const NEXT_RE     = /(?:^|\n)(?:__)?NEXT(?:__)?\s*:\s*(\{[\s\S]*)/

function extractJson(str: string): string | null {
  const start = str.indexOf('{')
  if (start === -1) return null
  let depth = 0
  for (let i = start; i < str.length; i++) {
    if (str[i] === '{') depth++
    else if (str[i] === '}') { depth--; if (depth === 0) return str.slice(start, i + 1) }
  }
  return null
}

// ── Design tokens (from mockup) ───────────────────────────────────────────────
// dark: variants — neutral dark (no warm-brown tint)
// paper:      #f2f2f1 / dark: #111111
// surface:    #ffffff  / dark: #181818
// surface-2:  #f6f6f5  / dark: #141414
// line:       #e2e2df  / dark: #2a2a2a
// line-soft:  #e8e8e6  / dark: #1f1f1f
// ink:        #2a2722  / dark: #f4ead8
// ink-2:      #5c564c  / dark: #c4b99a
// muted:      #938b7c  / dark: #7a7064
// gold:       #b88a1f  (unchanged)
// gold-deep:  #8a6713  (unchanged)
// gold-soft:  #ecdfc2  / dark: #332b12
// gold-tint:  #f5f0e4  / dark: #2a2315
// ─────────────────────────────────────────────────────────────────────────────

// ── Artifact config ───────────────────────────────────────────────────────────

const ARTIFACT_CONFIG: Record<ArtifactType, {
  Icon:      React.ComponentType<{ className?: string; strokeWidth?: number }>
  label:     string
  desc:      string
  iconBg:    string  // create card icon bg (always gold-tint)
  histBg:    string  // history item icon bg
  histColor: string  // history item icon color
}> = {
  audio_overview: {
    Icon: Headphones, label: 'Audio Overview', desc: 'Spoken summary of your notes',
    iconBg: 'bg-[#f5f0e4] dark:bg-[#2a2315]',
    histBg: 'bg-[#ece6f5] dark:bg-[#221a30]', histColor: 'text-[#5b4b86] dark:text-[#a98de8]',
  },
  flashcards: {
    Icon: Layers, label: 'Flashcards', desc: 'Active recall',
    iconBg: 'bg-[#f5f0e4] dark:bg-[#2a2315]',
    histBg: 'bg-[#fbede0] dark:bg-[#2e1e0e]', histColor: 'text-[#a4632a] dark:text-[#e09862]',
  },
  quiz: {
    Icon: HelpCircle, label: 'Quiz', desc: 'Test understanding',
    iconBg: 'bg-[#f5f0e4] dark:bg-[#2a2315]',
    histBg: 'bg-[#e7f0ea] dark:bg-[#152118]', histColor: 'text-[#4f7d3f] dark:text-[#7dba6a]',
  },
  slide_deck: {
    Icon: Monitor, label: 'Slide Deck', desc: 'Lesson slides',
    iconBg: 'bg-[#f5f0e4] dark:bg-[#2a2315]',
    histBg: 'bg-[#f5f0e4] dark:bg-[#2a2315]', histColor: 'text-[#8a6713] dark:text-[#c9a03c]',
  },
  study_guide: {
    Icon: BookOpen, label: 'Study Guide', desc: 'Structured revision notes from your active sources',
    iconBg: 'bg-[#f5f0e4] dark:bg-[#2a2315]',
    histBg: 'bg-[#f5f0e4] dark:bg-[#2a2315]', histColor: 'text-[#8a6713] dark:text-[#c9a03c]',
  },
}

const CREATE_ORDER: ArtifactType[] = ['audio_overview', 'flashcards', 'quiz', 'slide_deck', 'study_guide']

// ── Helpers ───────────────────────────────────────────────────────────────────

function autoTitle(type: ArtifactType, topic: string): string {
  const t = topic.length > 28 ? topic.slice(0, 28) + '…' : topic
  const m: Record<ArtifactType, string> = {
    audio_overview: `${t} — Audio Overview`,
    flashcards:     `${t} Flashcards`,
    quiz:           `${t} Quiz`,
    slide_deck:     `${t} Slide Deck`,
    study_guide:    `${t} Study Guide`,
  }
  return m[type]
}

function formatTime(s: number): string {
  const m = Math.floor(s / 60)
  return `${m}:${Math.floor(s % 60).toString().padStart(2, '0')}`
}

const CHIP_KEYWORDS: Partial<Record<ArtifactType, RegExp>> = {
  flashcards:     /\bflashcard(s)?\b/i,
  quiz:           /\bquiz\b/i,
  slide_deck:     /\bslide(s|[ -]deck)?\b/i,
  study_guide:    /\bstudy guide\b/i,
  audio_overview: /\baudio overview\b/i,
}

function detectChipType(text: string): ArtifactType | null {
  for (const [type, re] of Object.entries(CHIP_KEYWORDS) as [ArtifactType, RegExp][]) {
    if (re.test(text)) return type
  }
  return null
}

// ── PulseDot ─────────────────────────────────────────────────────────────────

function PulseDot({ color = 'bg-[#4f7d3f]' }: { color?: string }) {
  return (
    <span className="relative flex h-[7px] w-[7px] shrink-0">
      <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${color} opacity-60`} />
      <span className={`relative inline-flex rounded-full h-[7px] w-[7px] ${color}`} />
    </span>
  )
}

// ── AddSourceDialog ───────────────────────────────────────────────────────────

function AddSourceDialog({ onClose, onAdded }: {
  onClose: () => void
  onAdded: (note: StudentNote) => void
}) {
  const [tab,     setTab]     = useState<'write' | 'upload'>('write')
  const [subject, setSubject] = useState('')
  const [topic,   setTopic]   = useState('')
  const [content, setContent] = useState('')
  const [file,    setFile]    = useState<File | null>(null)
  const [pending, setPending] = useState(false)

  async function handleSubmit() {
    if (!subject.trim() || !topic.trim()) { toast.error('Subject and topic are required.'); return }
    setPending(true)
    try {
      if (tab === 'write') {
        if (!content.trim()) { toast.error('Write some notes first.'); return }
        const res = await submitStudentNote({ subject, topic, content })
        if (res.error) { toast.error(res.error.message); return }
        onAdded(res.data!); toast.success('Note added!')
      } else {
        if (!file) { toast.error('Select a file first.'); return }
        const fd = new FormData()
        fd.append('file', file); fd.append('subject', subject); fd.append('topic', topic)
        const res = await uploadStudentNote(fd)
        if (res.error) { toast.error(res.error.message); return }
        onAdded(res.data!); toast.success('File uploaded and extracted!')
      }
      onClose()
    } finally { setPending(false) }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#2a2722]/40 dark:bg-black/60 backdrop-blur-sm">
      <div className="bg-white dark:bg-[#181818] rounded-[18px] shadow-[0_2px_6px_rgba(42,39,34,.07),0_18px_40px_rgba(42,39,34,.14)] border border-[#e2e2df] dark:border-[#2a2a2a] w-full max-w-md mx-4 p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-[15px] text-[#2a2722] dark:text-[#f4ead8]" style={{ fontFamily: "'Fraunces', Georgia, serif" }}>
            Add source
          </h3>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-[#f6f6f5] dark:hover:bg-[#1f1f1f] text-[#938b7c] transition-colors">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex gap-1 bg-[#f6f6f5] dark:bg-[#141414] rounded-lg p-1">
          {(['write', 'upload'] as const).map(t => (
            <button key={t} onClick={() => setTab(t)}
              className={`flex-1 py-1.5 text-[13px] rounded-md transition-all ${
                tab === t
                  ? 'bg-white dark:bg-[#1f1f1f] text-[#2a2722] dark:text-[#f4ead8] font-medium shadow-sm'
                  : 'text-[#938b7c] hover:text-[#5c564c] dark:hover:text-[#c4b99a]'
              }`}>
              {t === 'write' ? 'Write note' : 'Upload file'}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label className="text-[11.5px] text-[#938b7c]">Subject</Label>
            <Input value={subject} onChange={e => setSubject(e.target.value)} placeholder="e.g. Biology"
              className="border-[#e2e2df] dark:border-[#2a2a2a] text-[#2a2722] dark:text-[#f4ead8]" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-[11.5px] text-[#938b7c]">Topic</Label>
            <Input value={topic} onChange={e => setTopic(e.target.value)} placeholder="e.g. Photosynthesis"
              className="border-[#e2e2df] dark:border-[#2a2a2a] text-[#2a2722] dark:text-[#f4ead8]" />
          </div>
        </div>

        {tab === 'write' ? (
          <Textarea value={content} onChange={e => setContent(e.target.value)}
            placeholder="Paste or write your notes here…" rows={5}
            className="resize-none border-[#e2e2df] dark:border-[#2a2a2a] text-[#2a2722] dark:text-[#f4ead8]" />
        ) : (
          <label className="flex flex-col items-center justify-center gap-2 border-2 border-dashed border-[#e2e2df] dark:border-[#2a2a2a] rounded-xl py-8 cursor-pointer hover:border-[#b88a1f] hover:bg-[#f5f0e4]/40 dark:hover:bg-[#2a2315]/40 transition-colors">
            <Upload className="h-5 w-5 text-[#938b7c]" />
            <span className="text-[12.5px] text-[#938b7c]">{file ? file.name : 'PDF, PNG, JPG, or WEBP'}</span>
            <input type="file" className="hidden" accept=".pdf,.png,.jpg,.jpeg,.webp"
              onChange={e => setFile(e.target.files?.[0] ?? null)} />
          </label>
        )}

        <div className="flex gap-2 justify-end pt-1">
          <button onClick={onClose}
            className="px-4 py-2 text-[13px] font-medium text-[#5c564c] dark:text-[#c4b99a] border border-[#e2e2df] dark:border-[#2a2a2a] rounded-[10px] hover:bg-[#f6f6f5] dark:hover:bg-[#1f1f1f] transition-colors">
            Cancel
          </button>
          <button onClick={handleSubmit} disabled={pending}
            className="px-4 py-2 text-[13px] font-semibold text-white rounded-[10px] transition-opacity disabled:opacity-50"
            style={{ background: 'linear-gradient(150deg, #b88a1f, #8a6713)', boxShadow: '0 3px 8px rgba(138,103,19,.30)' }}>
            {pending ? 'Adding…' : 'Add source'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── SourcesPanel ──────────────────────────────────────────────────────────────

function SourcesPanel({ notes, activeIds, onToggle, onAddClicked, className = '' }: {
  notes:        StudentNote[]
  activeIds:    Set<string>
  onToggle:     (id: string) => void
  onAddClicked: () => void
  className?:   string
}) {
  const activeCount = activeIds.size

  return (
    <div className={`flex flex-col h-full bg-[#f6f6f5] dark:bg-[#141414] border-r border-[#e2e2df] dark:border-[#2a2a2a] ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between px-[18px] pt-[18px] pb-3 shrink-0">
        <span className="text-[11px] font-bold tracking-[.13em] text-[#938b7c] uppercase">Sources</span>
        <button onClick={onAddClicked}
          className="flex items-center gap-1.5 text-[12.5px] font-semibold text-[#8a6713] dark:text-[#c9a03c] bg-[#f5f0e4] dark:bg-[#2a2315] border border-[#ecdfc2] dark:border-[#3d3020] px-[9px] py-[5px] rounded-[9px] hover:bg-[#ecdfc2] dark:hover:bg-[#332b12] transition-colors">
          <Plus className="h-3.5 w-3.5" strokeWidth={2} /> Add
        </button>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto px-3 space-y-1.5 py-1">
        {notes.length === 0 ? (
          <div className="px-3 py-10 text-center">
            <Sparkles className="h-7 w-7 mx-auto mb-3 text-[#e2e2df] dark:text-[#2a2a2a]" />
            <p className="text-[12px] text-[#938b7c] leading-relaxed">
              Add notes or upload PDFs to ground Tracy in your study materials
            </p>
          </div>
        ) : notes.map(note => {
          const Icon   = note.source_type === 'pdf' ? FileText : note.source_type === 'image' ? ImageIcon : PenLine
          const active = activeIds.has(note.id)
          return (
            <button key={note.id} onClick={() => onToggle(note.id)}
              className={`w-full flex gap-2.5 p-[11px] rounded-[12px] text-left transition-all border ${
                active
                  ? 'bg-white dark:bg-[#1f1f1f] border-[#ecdfc2] dark:border-[#3d3020] shadow-[0_1px_2px_rgba(42,39,34,.04),0_8px_24px_rgba(42,39,34,.06)]'
                  : 'border-transparent hover:bg-white dark:hover:bg-[#1f1f1f]'
              }`}>
              {/* Custom checkbox */}
              <div className={`flex-none mt-[1px] w-[18px] h-[18px] rounded-[6px] border flex items-center justify-center ${
                active
                  ? 'bg-[#b88a1f] border-[#b88a1f]'
                  : 'bg-white dark:bg-[#181818] border-[#e2e2df] dark:border-[#2a2a2a]'
              }`}>
                {active && <Check className="h-[11px] w-[11px] text-white" strokeWidth={2.6} />}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5 text-[13.5px] font-semibold text-[#2a2722] dark:text-[#f4ead8]">
                  <Icon className="h-3.5 w-3.5 text-[#b88a1f] shrink-0" strokeWidth={1.7} />
                  <span className="truncate">{note.topic}</span>
                </div>
                <div className="text-[11.5px] text-[#938b7c] mt-0.5">{note.subject}</div>
              </div>
            </button>
          )
        })}
      </div>

      {/* Footer */}
      <div className="mt-auto px-[18px] py-[13px] border-t border-[#e2e2df] dark:border-[#2a2a2a] flex items-center gap-1.5 text-[11.5px] text-[#938b7c] shrink-0">
        <PulseDot color={activeCount > 0 ? 'bg-[#4f7d3f]' : 'bg-[#938b7c]'} />
        {activeCount > 0 ? `${activeCount} source${activeCount !== 1 ? 's' : ''} active in this chat` : 'No sources active'}
      </div>
    </div>
  )
}

// ── NowPlayingDock ────────────────────────────────────────────────────────────

function NowPlayingDock({ artifact, playing, currentTime, duration, onPlayPause, onSeek, onDismiss }: {
  artifact:    Artifact
  playing:     boolean
  currentTime: number
  duration:    number
  onPlayPause: () => void
  onSeek:      (t: number) => void
  onDismiss:   () => void
}) {
  const pct = duration > 0 ? (currentTime / duration) * 100 : 0

  return (
    <div className="mx-[14px] mt-3 mb-1 rounded-[16px] p-[13px] shrink-0 text-[#f4ecdb]"
      style={{ background: 'linear-gradient(160deg, #222222, #181818)', boxShadow: '0 2px 6px rgba(0,0,0,.15),0 18px 40px rgba(0,0,0,.20)' }}>
      <div className="flex items-center gap-[11px]">
        <button onClick={onPlayPause}
          className="w-10 h-10 rounded-full bg-[#b88a1f] hover:bg-[#8a6713] flex items-center justify-center shrink-0 transition-colors border-0">
          {playing ? <Pause className="h-4 w-4 text-[#181818] fill-[#181818]" strokeWidth={0} /> : <Play className="h-4 w-4 text-[#181818] fill-[#181818]" strokeWidth={0} />}
        </button>
        <div className="min-w-0 flex-1">
          <div className="text-[13px] font-semibold truncate">{artifact.title}</div>
          <div className="flex items-center gap-1.5 text-[11px] text-[#bcae93] mt-[1px]">
            <Headphones className="h-3 w-3" strokeWidth={1.8} />
            <span className="truncate">{artifact.sourceLabels[0] ?? 'Overview'}</span>
          </div>
        </div>
        <button onClick={onDismiss} className="text-[#bcae93] hover:text-white ml-auto p-1 border-0 bg-transparent transition-colors">
          <X className="h-4 w-4" strokeWidth={2} />
        </button>
      </div>
      {/* Progress bar */}
      <div className="mt-[11px] h-1 rounded-full bg-white/16 relative overflow-hidden">
        <div className="absolute inset-y-0 left-0 bg-[#b88a1f] rounded-full transition-all"
          style={{ width: `${pct}%` }} />
      </div>
      <div className="flex justify-between text-[10.5px] text-[#bcae93] mt-1.5">
        <span>{formatTime(currentTime)}</span>
        <span>{formatTime(duration)}</span>
      </div>
      {/* Hidden range input for seeking */}
      <input type="range" min={0} max={duration || 0} value={currentTime}
        onChange={e => onSeek(Number(e.target.value))}
        className="absolute opacity-0 w-full cursor-pointer" style={{ height: '4px', marginTop: '-20px' }} />
    </div>
  )
}

// ── CreateGrid ────────────────────────────────────────────────────────────────

function CreateGrid({ activeIds, generatingType, onGenerate }: {
  activeIds:      Set<string>
  generatingType: ArtifactType | null
  onGenerate:     (type: ArtifactType) => void
}) {
  const disabled = activeIds.size === 0

  return (
    <TooltipProvider delayDuration={0}>
      <div className="grid grid-cols-2 gap-[9px] px-[14px]">
        {CREATE_ORDER.map(type => {
          const { Icon, label, desc, iconBg } = ARTIFACT_CONFIG[type]
          const wide  = type === 'study_guide'
          const isGen = generatingType === type

          return (
            <Tooltip key={type}>
              <TooltipTrigger asChild>
                <button
                  disabled={disabled || !!generatingType}
                  onClick={() => onGenerate(type)}
                  className={`group rounded-[13px] border border-[#e2e2df] dark:border-[#2a2a2a] bg-white dark:bg-[#181818] p-[13px] text-left font-[inherit] transition-all duration-150 ${
                    wide ? 'col-span-2 flex items-center gap-[11px]' : 'flex flex-col'
                  } ${
                    disabled || !!generatingType
                      ? 'opacity-40 cursor-not-allowed'
                      : 'cursor-pointer hover:border-[#ecdfc2] dark:hover:border-[#3d3020] hover:-translate-y-0.5 hover:shadow-[0_1px_2px_rgba(42,39,34,.04),0_8px_24px_rgba(42,39,34,.06)]'
                  }`}
                >
                  <div className={`w-8 h-8 rounded-[9px] flex items-center justify-center text-[#8a6713] dark:text-[#c9a03c] ${iconBg} ${wide ? 'shrink-0' : 'mb-[9px]'}`}>
                    {isGen
                      ? <span className="h-[14px] w-[14px] border-2 border-[#8a6713] dark:border-[#c9a03c] border-t-transparent rounded-full animate-spin" />
                      : <Icon className="h-[14px] w-[14px]" strokeWidth={1.8} />}
                  </div>
                  <div>
                    <div className="text-[13px] font-semibold text-[#2a2722] dark:text-[#f4ead8]">{label}</div>
                    <div className="text-[11px] text-[#938b7c] mt-[2px] leading-[1.35]">{desc}</div>
                  </div>
                </button>
              </TooltipTrigger>
              {disabled && <TooltipContent>Select at least one source first</TooltipContent>}
            </Tooltip>
          )
        })}
      </div>
    </TooltipProvider>
  )
}

// ── ArtifactItem ─────────────────────────────────────────────────────────────

function ArtifactItem({ artifact, isRenaming, onOpen, onRename, onDelete, onRetry, onRenameSubmit }: {
  artifact:       Artifact
  isRenaming:     boolean
  onOpen:         (a: Artifact) => void
  onRename:       (id: string) => void
  onDelete:       (id: string) => void
  onRetry:        (a: Artifact) => void
  onRenameSubmit: (id: string, title: string) => void
}) {
  const { Icon, histBg, histColor } = ARTIFACT_CONFIG[artifact.type]
  const [renameVal, setRenameVal] = useState(artifact.title)

  const ago = (() => {
    const m = Math.round((Date.now() - new Date(artifact.createdAt).getTime()) / 60000)
    return m < 1 ? 'just now' : m === 1 ? '1 min ago' : `${m} min ago`
  })()

  return (
    <div
      onClick={() => artifact.status === 'ready' && onOpen(artifact)}
      className={`group relative flex items-center gap-[11px] bg-white dark:bg-[#181818] border border-[#e2e2df] dark:border-[#2a2a2a] rounded-[13px] p-[11px] transition-all duration-150 ${
        artifact.status === 'ready' ? 'cursor-pointer hover:shadow-[0_1px_2px_rgba(42,39,34,.04),0_8px_24px_rgba(42,39,34,.06)] hover:border-[#ecdfc2] dark:hover:border-[#3d3020]' : ''
      }`}>
      <div className={`w-[34px] h-[34px] rounded-[10px] flex items-center justify-center shrink-0 ${histBg} ${histColor}`}>
        <Icon className="h-4 w-4" strokeWidth={1.8} />
      </div>
      <div className="min-w-0 flex-1">
        {isRenaming ? (
          <form onSubmit={e => { e.preventDefault(); onRenameSubmit(artifact.id, renameVal) }}>
            <input autoFocus value={renameVal} onChange={e => setRenameVal(e.target.value)}
              onBlur={() => onRenameSubmit(artifact.id, renameVal)}
              className="w-full text-[13px] border border-[#b88a1f] rounded-[6px] px-2 py-0.5 text-[#2a2722] dark:text-[#f4ead8] bg-white dark:bg-[#181818] outline-none"
              onClick={e => e.stopPropagation()} />
          </form>
        ) : (
          <div className="text-[13px] font-semibold text-[#2a2722] dark:text-[#f4ead8] truncate">{artifact.title}</div>
        )}
        <div className="flex items-center gap-1.5 text-[11px] text-[#938b7c] mt-[2px] flex-wrap">
          {artifact.status === 'generating' && (
            <span className="text-[10px] font-semibold text-[#8a6713] dark:text-[#c9a03c] bg-[#f5f0e4] dark:bg-[#2a2315] px-[7px] py-[2px] rounded-full">Generating…</span>
          )}
          {artifact.status === 'ready' && (
            <span className="text-[10px] font-semibold text-[#4f7d3f] dark:text-[#7dba6a] bg-[#eaf2e3] dark:bg-[#152118] px-[7px] py-[2px] rounded-full">Ready</span>
          )}
          {artifact.status === 'failed' && (
            <>
              <span className="text-[10px] font-semibold text-[#a23a2c] bg-[#f7e3e0] px-[7px] py-[2px] rounded-full">Failed</span>
              <button onClick={e => { e.stopPropagation(); onRetry(artifact) }}
                className="text-[10px] font-semibold text-[#b88a1f] hover:text-[#8a6713] transition-colors">Retry</button>
            </>
          )}
          <span>{ago}</span>
        </div>
        {artifact.status === 'generating' && (
          <div className="mt-[7px] h-[3px] rounded-full bg-[#ecdfc2] dark:bg-[#332b12] overflow-hidden">
            <div className="h-full bg-[#b88a1f] rounded-full animate-[grow_2.6s_ease-in-out_infinite_alternate]"
              style={{ width: '35%' }} />
          </div>
        )}
      </div>
      {artifact.status !== 'generating' && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              onClick={e => e.stopPropagation()}
              className="opacity-0 group-hover:opacity-100 text-[#938b7c] hover:text-[#2a2722] dark:hover:text-[#f4ead8] hover:bg-[#f6f6f5] dark:hover:bg-[#1f1f1f] p-1 rounded-[7px] transition-all border-0 bg-transparent shrink-0">
              <MoreHorizontal className="h-4 w-4" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="min-w-[160px]">
            {artifact.status === 'ready' && (
              <DropdownMenuItem onClick={() => onOpen(artifact)}>Open</DropdownMenuItem>
            )}
            <DropdownMenuItem onClick={() => onRename(artifact.id)}>Rename</DropdownMenuItem>
            <DropdownMenuItem onClick={() => onDelete(artifact.id)}
              className="text-destructive focus:text-destructive">Delete</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    </div>
  )
}

// ── ArtifactHistory ───────────────────────────────────────────────────────────

function ArtifactHistory({ artifacts, onOpen, onRename, onDelete, onRetry, renamingId, onRenameSubmit }: {
  artifacts:      Artifact[]
  onOpen:         (a: Artifact) => void
  onRename:       (id: string) => void
  onDelete:       (id: string) => void
  onRetry:        (a: Artifact) => void
  renamingId:     string | null
  onRenameSubmit: (id: string, title: string) => void
}) {
  if (artifacts.length === 0) {
    return (
      <p className="text-[11.5px] text-[#938b7c] text-center px-[18px] py-3.5 leading-[1.5]">
        Everything you generate collects here, then saves to your <b className="text-[#5c564c] dark:text-[#c4b99a]">Knowledge Base</b> for later.
      </p>
    )
  }

  return (
    <div className="px-[14px] flex flex-col gap-2">
      {artifacts.map(artifact => (
        <ArtifactItem
          key={artifact.id}
          artifact={artifact}
          isRenaming={renamingId === artifact.id}
          onOpen={onOpen}
          onRename={onRename}
          onDelete={onDelete}
          onRetry={onRetry}
          onRenameSubmit={onRenameSubmit}
        />
      ))}
    </div>
  )
}

// ── ToolStatusPanel ───────────────────────────────────────────────────────────

function ToolStatusPanel({ tools }: { tools: ToolStatus[] }) {
  const [expanded, setExpanded] = useState(false)
  if (tools.length === 0) return null
  const running = tools.find(t => t.status === 'running')
  const last = [...tools].reverse().find(t => t.status !== 'running')
  const summary = (running?.label ?? last?.label ?? 'Working…').replace(/…$/, '')
  return (
    <div className="mt-2">
      <button onClick={() => setExpanded(v => !v)} className="flex items-center gap-1.5 group text-left">
        {running && <span className="w-2.5 h-2.5 border border-[#8a6713]/40 border-t-[#8a6713] rounded-full animate-spin shrink-0" />}
        <span className="text-[11.5px] italic text-[#8a6713]/75 group-hover:text-[#8a6713] transition-colors">{summary}</span>
        <ChevronRight className={`w-3 h-3 text-[#8a6713]/50 transition-all shrink-0 ${expanded ? 'rotate-90' : ''}`} />
      </button>
      {expanded && (
        <div className="mt-2 pl-3 border-l border-[#8a6713]/20 space-y-1.5">
          {tools.map((t, i) => (
            <div key={i} className="flex items-center gap-2 text-[11px] text-[#938b7c]">
              <span className="shrink-0">
                {t.status === 'running'
                  ? <span className="w-2 h-2 border border-[#8a6713]/50 border-t-[#8a6713] rounded-full animate-spin inline-block" />
                  : t.status === 'done'
                  ? <span className="text-[#4f7d3f] text-[10px]">✓</span>
                  : <span className="text-red-400 text-[10px]">✕</span>}
              </span>
              <span className={t.status === 'running' ? 'text-[#2a2722] dark:text-[#f4ead8]' : ''}>{t.label}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ── MessageBubble ─────────────────────────────────────────────────────────────

function MessageBubble({ message, activeIds, onGenerateChip, toolStatuses }: {
  message:        Message
  activeIds:      Set<string>
  onGenerateChip: (type: ArtifactType) => void
  toolStatuses?:  ToolStatus[]
}) {
  const isUser  = message.role === 'user'
  const content = message.content.replace(/\bNEXT:\s*/g, '').trim()
  const chipType = !isUser && activeIds.size > 0 && content ? detectChipType(content) : null

  if (isUser) {
    return (
      <div className="flex gap-3 max-w-[80%] ml-auto flex-row-reverse">
        <div className="w-[30px] h-[30px] rounded-[9px] shrink-0 flex items-center justify-center text-[#ecdfc2] text-[12px] font-semibold"
          style={{ background: '#222222' }}>
          {/* User initials — blank for now */}
        </div>
        <div className="text-[#fdf7e7] text-[14.5px] leading-[1.55] px-4 py-3"
          style={{ background: 'linear-gradient(160deg, #9a7619, #82610f)', borderRadius: '16px 4px 16px 16px', boxShadow: '0 4px 12px rgba(130,97,15,.20)' }}>
          {content}
        </div>
      </div>
    )
  }

  return (
    <div className="flex gap-3 max-w-[80%]">
      <div className="w-[30px] h-[30px] rounded-[9px] shrink-0 flex items-center justify-center bg-[#f5f0e4] dark:bg-[#2a2315] text-[#8a6713] dark:text-[#c9a03c]">
        <Sparkles className="h-[14px] w-[14px]" strokeWidth={1.8} />
      </div>
      <div className="bg-[#f6f6f5] dark:bg-[#141414] border border-[#e8e8e6] dark:border-[#1f1f1f] text-[#2a2722] dark:text-[#f4ead8] text-[14.5px] leading-[1.62] px-[17px] py-[14px]"
        style={{ borderRadius: '4px 16px 16px 16px' }}>
        {message.isLoading ? (
          <div>
            <span className="flex gap-1 items-center h-5">
              <span className="h-1.5 w-1.5 bg-[#938b7c] rounded-full animate-bounce [animation-delay:0ms]" />
              <span className="h-1.5 w-1.5 bg-[#938b7c] rounded-full animate-bounce [animation-delay:150ms]" />
              <span className="h-1.5 w-1.5 bg-[#938b7c] rounded-full animate-bounce [animation-delay:300ms]" />
            </span>
            {toolStatuses && <ToolStatusPanel tools={toolStatuses} />}
          </div>
        ) : (
          <>
            <div className="prose prose-sm max-w-none [&_*]:text-[#2a2722] dark:[&_*]:text-[#f4ead8] [&_a]:text-[#b88a1f] [&_p]:mb-[9px] [&_p:last-child]:mb-0">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
            </div>
            {chipType && (
              <div className="mt-3">
                <button onClick={() => onGenerateChip(chipType)}
                  className="inline-flex items-center gap-2 text-[12.5px] font-semibold text-[#8a6713] dark:text-[#c9a03c] bg-white dark:bg-[#181818] border border-[#ecdfc2] dark:border-[#3d3020] px-3 py-[7px] rounded-full hover:bg-[#f5f0e4] dark:hover:bg-[#2a2315] hover:-translate-y-px transition-all">
                  <Zap className="h-3.5 w-3.5" strokeWidth={1.8} />
                  Generate {ARTIFACT_CONFIG[chipType].label} →
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}

// ── Main: StudentTracyPage ────────────────────────────────────────────────────

export function StudentTracyPage({ user, weakSubjects, currentTopics, initialNotes }: {
  user:            any
  weakSubjects:    string[]
  currentTopics:   string[]
  subjectProgress: SubjectProgress[]
  initialNotes:    StudentNote[]
}) {
  const router = useRouter()

  const [messages,     setMessages]     = useState<Message[]>([])
  const [input,        setInput]        = useState('')
  const [streaming,    setStreaming]    = useState(false)
  const [toolStatuses, setToolStatuses] = useState<ToolStatus[]>([])

  const [notes,     setNotes]     = useState<StudentNote[]>(initialNotes)
  const [activeIds, setActiveIds] = useState<Set<string>>(new Set())
  const [addOpen,   setAddOpen]   = useState(false)

  const [artifacts,      setArtifacts]      = useState<Artifact[]>([])
  const [currentAudio,   setCurrentAudio]   = useState<Artifact | null>(null)
  const [audioPlaying,   setAudioPlaying]   = useState(false)
  const [audioTime,      setAudioTime]      = useState(0)
  const [audioDuration,  setAudioDuration]  = useState(0)
  const [generatingType, setGeneratingType] = useState<ArtifactType | null>(null)
  const [renamingId,     setRenamingId]     = useState<string | null>(null)
  const [inputFocused,   setInputFocused]   = useState(false)
  const [mobileTab,      setMobileTab]      = useState<'sources' | 'chat' | 'studio'>('chat')

  const bottomRef   = useRef<HTMLDivElement>(null)
  const abortRef    = useRef<AbortController | null>(null)
  const audioRef    = useRef<HTMLAudioElement | null>(null)
  const inputRef    = useRef<HTMLInputElement>(null)
  const sessionIdRef = useRef<string>(crypto.randomUUID())

  const userId    = user?.user_id ?? user?.id ?? 'anon'
  const STORE_KEY = `tracy_artifacts_${userId}`

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORE_KEY)
      if (raw) setArtifacts(JSON.parse(raw) as Artifact[])
    } catch {}
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  useEffect(() => {
    const el = audioRef.current
    if (!el) return
    const onTime  = () => setAudioTime(el.currentTime)
    const onDur   = () => setAudioDuration(el.duration)
    const onEnded = () => setAudioPlaying(false)
    el.addEventListener('timeupdate', onTime)
    el.addEventListener('durationchange', onDur)
    el.addEventListener('ended', onEnded)
    return () => {
      el.removeEventListener('timeupdate', onTime)
      el.removeEventListener('durationchange', onDur)
      el.removeEventListener('ended', onEnded)
    }
  }, [])

  function persistArtifacts(next: Artifact[]) {
    setArtifacts(next)
    try { localStorage.setItem(STORE_KEY, JSON.stringify(next)) } catch {}
  }

  function updateArtifact(id: string, patch: Partial<Artifact>) {
    setArtifacts(prev => {
      const next = prev.map(a => a.id === id ? { ...a, ...patch } : a)
      try { localStorage.setItem(STORE_KEY, JSON.stringify(next)) } catch {}
      return next
    })
  }

  function loadAndPlayAudio(artifact: Artifact) {
    if (!artifact.audio_url) return
    setCurrentAudio(artifact)
    if (!audioRef.current) audioRef.current = new Audio(artifact.audio_url)
    else audioRef.current.src = artifact.audio_url
    audioRef.current.play().catch(() => {})
    setAudioPlaying(true)
  }

  function togglePlayPause() {
    const el = audioRef.current; if (!el) return
    if (audioPlaying) { el.pause(); setAudioPlaying(false) }
    else { el.play().catch(() => {}); setAudioPlaying(true) }
  }

  function seekAudio(t: number) {
    if (!audioRef.current) return
    audioRef.current.currentTime = t
    setAudioTime(t)
  }

  function dismissAudio() {
    audioRef.current?.pause()
    setCurrentAudio(null); setAudioPlaying(false); setAudioTime(0)
  }

  const activeNotes   = notes.filter(n => activeIds.has(n.id))
  const activeSubject = activeNotes[0]?.subject ?? ''
  const activeTopic   = activeNotes[0]?.topic   ?? ''

  function toggleSource(id: string) {
    setActiveIds(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n })
  }

  async function handleGenerate(type: ArtifactType) {
    if (activeIds.size === 0) { toast.error('Select at least one source first.'); return }
    if (!activeSubject || !activeTopic) { toast.error('Activate a source to set subject and topic.'); return }

    const tempId    = crypto.randomUUID()
    const sourceIds = Array.from(activeIds)

    const newArt: Artifact = {
      id: tempId, type, status: 'generating',
      title: autoTitle(type, activeTopic),
      sourceNoteIds: sourceIds,
      sourceLabels:  activeNotes.map(n => n.topic),
      createdAt: new Date().toISOString(),
    }

    persistArtifacts([newArt, ...artifacts])
    setGeneratingType(type)

    try {
      if (type === 'audio_overview') {
        const res = await generateAudioOverview(activeSubject, activeTopic, sourceIds)
        if (res.error) { updateArtifact(tempId, { status: 'failed' }); toast.error(res.error.message); return }
        const url = res.data?.audio_url ?? null
        updateArtifact(tempId, { status: 'ready', audio_url: url ?? undefined })
        if (url) loadAndPlayAudio({ ...newArt, status: 'ready', audio_url: url })
        else toast.info('Audio generation is not currently configured.')
      } else {
        const res = await generateStudyPlanFromSources(activeSubject, activeTopic, type as any, sourceIds)
        if (res.error) { updateArtifact(tempId, { status: 'failed' }); toast.error(res.error.message); return }
        updateArtifact(tempId, { status: 'ready', plan_id: res.data?.plan_id })
        toast.success(`${ARTIFACT_CONFIG[type].label} ready!`)
      }
      if (document.hidden) {
        try { await createArtifactNotification(autoTitle(type, activeTopic)) } catch {}
      }
    } catch {
      updateArtifact(tempId, { status: 'failed' })
      toast.error('Generation failed — please try again.')
    } finally {
      setGeneratingType(null)
    }
  }

  function handleOpenArtifact(artifact: Artifact) {
    if (artifact.type === 'audio_overview' && artifact.audio_url) loadAndPlayAudio(artifact)
    else if (artifact.plan_id) router.push(`/student/study-plans/${artifact.plan_id}/studio`)
  }

  async function handleRenameSubmit(id: string, title: string) {
    setRenamingId(null)
    if (!title.trim()) return
    updateArtifact(id, { title: title.trim() })
    const artifact = artifacts.find(a => a.id === id)
    if (artifact?.plan_id) await renameArtifact(artifact.plan_id, title.trim())
  }

  async function sendMessage(text: string) {
    if (!text.trim() || streaming) return
    setInput('')
    setToolStatuses([])

    const userMsg:    Message = { id: crypto.randomUUID(), role: 'user',  content: text, timestamp: new Date() }
    const loadingMsg: Message = { id: crypto.randomUUID(), role: 'tracy', content: '',   timestamp: new Date(), isLoading: true }
    setMessages(prev => [...prev, userMsg, loadingMsg])
    setStreaming(true)

    abortRef.current?.abort()
    const abort = new AbortController()
    abortRef.current = abort
    let accumulated = ''

    try {
      const res = await fetch('/api/tracy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text, sessionId: sessionIdRef.current, mode: 'student', sourceIds: Array.from(activeIds) }),
        signal: abort.signal,
      })
      if (!res.ok) throw new Error('unavailable')

      const reader  = res.body!.getReader()
      const decoder = new TextDecoder()
      let buffer    = ''
      while (true) {
        const { value, done } = await reader.read()
        if (done) break
        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n'); buffer = lines.pop() ?? ''
        for (const line of lines) {
          if (!line.startsWith('data: ')) continue
          try {
            const ev = JSON.parse(line.slice(6).trim())
            switch (ev.type) {
              case 'tool_call':
                setToolStatuses(prev => {
                  if (prev.find(t => t.name === ev.name && t.status === 'running')) return prev
                  return [...prev, { name: ev.name, label: ev.label, status: 'running' }]
                })
                break
              case 'tool_result':
                setToolStatuses(prev =>
                  prev.map(t => t.name === ev.name && t.status === 'running'
                    ? { ...t, status: ev.success ? 'done' : 'failed' }
                    : t)
                )
                break
              case 'text_delta':
                accumulated += ev.delta ?? ''
                setMessages(p => p.map(m => m.isLoading ? { ...m, content: accumulated } : m))
                break
              case 'error': {
                const msg = ev.message === '__AUTH_PENDING__'
                  ? 'Session expired — please refresh and try again.'
                  : 'Sorry, I had trouble responding. Please try again.'
                setMessages(p => p.map(m => m.isLoading ? { ...m, content: msg, isLoading: false } : m))
                setToolStatuses([])
                return
              }
              case 'done': {
                const reply = (accumulated || ev.reply || '').trim()

                // Strip CONFIRM / NEXT / ARTIFACT markers from displayed text
                const confirmMatch = reply.match(CONFIRM_RE)
                const artifactMatch = reply.match(ARTIFACT_RE)
                const nextMatch = reply.match(NEXT_RE)

                let display = reply
                if (confirmMatch) display = reply.slice(0, reply.search(CONFIRM_RE)).trim()
                else if (artifactMatch) {
                  const prefixEnd = reply.search(ARTIFACT_RE)
                  const json = extractJson(artifactMatch[1])
                  const parsed = json ? (() => { try { return JSON.parse(json) } catch { return null } })() : null
                  display = (prefixEnd > 0 ? reply.slice(0, prefixEnd).trim() : '')
                    || parsed?.summary
                    || `Here's what I found — see the details below.`
                } else if (nextMatch) {
                  display = reply.slice(0, reply.search(NEXT_RE)).trim() || reply
                }

                setMessages(p => p.map(m => m.isLoading ? { ...m, content: display || reply, isLoading: false } : m))
                setToolStatuses([])
                accumulated = ''
                break
              }
            }
          } catch {}
        }
      }
    } catch (err: any) {
      if (err?.name === 'AbortError') return
      toast.error('Sorry, I had trouble responding. Please try again.')
      setMessages(p => p.filter(m => !m.isLoading))
      setToolStatuses([])
    } finally { setStreaming(false) }
  }

  function newChat() {
    abortRef.current?.abort()
    sessionIdRef.current = crypto.randomUUID()
    setMessages([]); setInput(''); setStreaming(false); setToolStatuses([])
  }

  function fillInput(text: string) {
    setInput(text)
    inputRef.current?.focus()
  }

  const showSuggestions = messages.length === 0
  const suggestions = activeNotes.length > 0
    ? [`Summarize the key points of ${activeTopic}`, `Explain ${activeTopic} in simple terms`, `Quiz me on ${activeTopic}`, `What are common misconceptions about ${activeTopic}?`]
    : currentTopics.length > 0
    ? [`Help me understand ${currentTopics[0]}`, `What should I focus on for ${weakSubjects[0] ?? 'my next exam'}?`, `How do I revise effectively?`, `Explain active recall`]
    : [`How do I revise effectively?`, `What is spaced repetition?`, `Help me make a study plan`, `Explain active recall`]

  return (
    <div className="h-full bg-[#f2f2f1] dark:bg-[#111111] p-3 lg:p-4">
      {/* App card */}
      <div className="h-full flex flex-col lg:grid lg:grid-cols-[248px_1fr_332px] bg-white dark:bg-[#181818] border border-[#e2e2df] dark:border-[#2a2a2a] rounded-[22px] overflow-hidden"
        style={{ boxShadow: '0 2px 6px rgba(42,39,34,.07), 0 18px 40px rgba(42,39,34,.10)' }}>

        {/* Mobile tab bar — only visible below lg */}
        <div className="flex lg:hidden shrink-0 items-center border-b border-[#e8e8e6] dark:border-[#1f1f1f] bg-[#f6f6f5] dark:bg-[#141414] px-3 py-1">
          {([
            { id: 'sources', label: 'Sources', Icon: FileText },
            { id: 'chat',    label: 'Chat',    Icon: Sparkles },
            { id: 'studio',  label: 'Studio',  Icon: Layers },
          ] as const).map(tab => (
            <button key={tab.id} onClick={() => setMobileTab(tab.id)}
              className={`flex-1 flex flex-col items-center gap-0.5 py-2 rounded-xl text-[11px] font-semibold transition-colors ${
                mobileTab === tab.id
                  ? 'text-[#8a6713] dark:text-[#c9a03c]'
                  : 'text-[#938b7c]'
              }`}>
              <tab.Icon className="h-4 w-4" strokeWidth={1.8} />
              {tab.label}
            </button>
          ))}
        </div>

        {/* ── Sources ── */}
        <div className={`${mobileTab === 'sources' ? 'flex flex-col flex-1 min-h-0' : 'hidden'} lg:flex lg:flex-col`}>
          <SourcesPanel
            notes={notes} activeIds={activeIds}
            onToggle={toggleSource} onAddClicked={() => setAddOpen(true)}
          />
        </div>

        {/* ── Chat ── */}
        <div className={`${mobileTab === 'chat' ? 'flex flex-col flex-1 min-h-0' : 'hidden'} lg:flex lg:flex-col bg-white dark:bg-[#181818] min-w-0`}>

          {/* Chat header */}
          <div className="flex items-center justify-between px-[22px] py-[15px] border-b border-[#e8e8e6] dark:border-[#1f1f1f] shrink-0">
            <div className="flex items-center gap-[11px] min-w-0">
              <div className="w-[38px] h-[38px] rounded-[11px] bg-[#f5f0e4] dark:bg-[#2a2315] flex items-center justify-center text-[#8a6713] dark:text-[#c9a03c] shrink-0">
                <Sparkles className="h-[18px] w-[18px]" strokeWidth={1.8} />
              </div>
              <div className="min-w-0">
                <h3 className="m-0 text-[17px] font-semibold tracking-[-0.01em] text-[#2a2722] dark:text-[#f4ead8] leading-tight"
                  style={{ fontFamily: "'Fraunces', Georgia, serif" }}>
                  Tracy
                </h3>
                <div className="flex items-center gap-[5px] text-[11.5px] text-[#938b7c] mt-[1px]">
                  <PulseDot color={activeIds.size > 0 ? 'bg-[#4f7d3f]' : 'bg-[#c4b8a8]'} />
                  {activeIds.size > 0
                    ? `Grounded in ${activeIds.size} source${activeIds.size !== 1 ? 's' : ''}`
                    : 'No sources active'}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
              <ThemeToggle />
              {messages.length > 0 && (
                <button onClick={newChat}
                  className="flex items-center gap-1.5 text-[12.5px] font-semibold text-[#5c564c] dark:text-[#c4b99a] border border-[#e2e2df] dark:border-[#2a2a2a] px-3 py-[7px] rounded-[10px] hover:bg-[#f6f6f5] dark:hover:bg-[#1c1c1c] hover:text-[#2a2722] dark:hover:text-[#f4ead8] transition-colors">
                  <RotateCcw className="h-3.5 w-3.5" strokeWidth={1.8} /> New chat
                </button>
              )}
            </div>
          </div>

          {/* Message stream */}
          <div className="flex-1 overflow-y-auto px-[22px] pt-[26px] pb-2 flex flex-col gap-5">
            {showSuggestions ? (
              <div className="flex flex-col items-center justify-center h-full gap-5 pb-6">
                <div className="text-center space-y-1.5">
                  <p className="text-xl font-semibold text-[#2a2722] dark:text-[#f4ead8]"
                    style={{ fontFamily: "'Fraunces', Georgia, serif" }}>
                    {user?.name ? `Hi, ${user.name.split(' ')[0]}` : 'Hello'}
                  </p>
                  <p className="text-[13px] text-[#938b7c] max-w-xs leading-relaxed">
                    {activeIds.size > 0
                      ? `Grounded in ${activeIds.size} source${activeIds.size !== 1 ? 's' : ''}. What would you like to explore?`
                      : 'Add sources from the panel to ground our conversation.'}
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-2 w-full max-w-sm">
                  {suggestions.map((s, i) => (
                    <button key={i} onClick={() => fillInput(s)}
                      className="text-left text-[12.5px] font-medium text-[#5c564c] dark:text-[#c4b99a] px-3 py-2.5 rounded-xl border border-[#e2e2df] dark:border-[#2a2a2a] bg-white dark:bg-[#181818] hover:border-[#ecdfc2] dark:hover:border-[#3d3020] hover:text-[#2a2722] dark:hover:text-[#f4ead8] hover:shadow-[0_1px_2px_rgba(42,39,34,.04),0_8px_24px_rgba(42,39,34,.06)] transition-all">
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              messages.map(msg => (
                <MessageBubble key={msg.id} message={msg} activeIds={activeIds}
                  onGenerateChip={type => handleGenerate(type)}
                  toolStatuses={msg.isLoading ? toolStatuses : undefined} />
              ))
            )}
            <div ref={bottomRef} />
          </div>

          {/* Composer */}
          <div className="px-[22px] pt-3 pb-[18px] border-t border-[#e8e8e6] dark:border-[#1f1f1f] shrink-0">
            {/* Quick-action chips */}
            <div className="flex gap-2 mb-2.5 flex-wrap">
              {[
                { label: 'Summarize source', fn: () => fillInput(`Summarize the key points of my ${activeTopic || 'active source'}`) },
                { label: 'Explain a concept', fn: () => fillInput(`Explain ${activeTopic || 'the key concept'} in simple terms`) },
                { label: 'Make flashcards',  fn: () => handleGenerate('flashcards') },
                { label: 'Audio overview',   fn: () => handleGenerate('audio_overview') },
              ].map(chip => (
                <TooltipProvider key={chip.label} delayDuration={0}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button onClick={chip.fn} disabled={activeIds.size === 0}
                        className="text-[12.5px] font-medium text-[#5c564c] dark:text-[#c4b99a] bg-white dark:bg-[#181818] border border-[#e2e2df] dark:border-[#2a2a2a] px-3 py-[7px] rounded-full hover:bg-[#f5f0e4] dark:hover:bg-[#2a2315] hover:border-[#ecdfc2] dark:hover:border-[#3d3020] hover:text-[#8a6713] dark:hover:text-[#c9a03c] hover:-translate-y-px disabled:opacity-40 disabled:cursor-not-allowed transition-all">
                        {chip.label}
                      </button>
                    </TooltipTrigger>
                    {activeIds.size === 0 && <TooltipContent>Select at least one source first</TooltipContent>}
                  </Tooltip>
                </TooltipProvider>
              ))}
            </div>

            {/* Input wrapper */}
            <div className={`flex items-center gap-2.5 bg-[#f6f6f5] dark:bg-[#141414] border rounded-[14px] px-4 py-[6px] transition-all ${
              inputFocused
                ? 'border-[#b88a1f] shadow-[0_0_0_3px_#ecdfc2] dark:shadow-[0_0_0_3px_#332b12]'
                : 'border-[#e2e2df] dark:border-[#2a2a2a]'
            }`}>
              <input
                ref={inputRef}
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(input) } }}
                onFocus={() => setInputFocused(true)}
                onBlur={() => setInputFocused(false)}
                placeholder="Ask Tracy anything…"
                className="flex-1 border-0 bg-transparent outline-none text-[14px] text-[#2a2722] dark:text-[#f4ead8] placeholder:text-[#938b7c] font-[inherit] py-2"
              />
              <button
                onClick={() => sendMessage(input)}
                disabled={!input.trim() || streaming}
                className="w-[38px] h-[38px] rounded-[10px] flex items-center justify-center shrink-0 border-0 disabled:opacity-40 disabled:cursor-not-allowed transition-opacity"
                style={{ background: 'linear-gradient(150deg, #b88a1f, #8a6713)', boxShadow: '0 3px 8px rgba(138,103,19,.30)' }}>
                <ArrowUp className="h-4 w-4 text-white" strokeWidth={2} />
              </button>
            </div>
            <p className="text-center text-[11px] text-[#938b7c] mt-2.5">Tracy can make mistakes. Always verify with your teacher.</p>
          </div>
        </div>

        {/* ── Studio ── */}
        <div className={`${mobileTab === 'studio' ? 'flex flex-col flex-1' : 'hidden'} min-h-0 lg:flex lg:flex-col bg-[#f6f6f5] dark:bg-[#141414] border-l border-[#e2e2df] dark:border-[#2a2a2a]`}>

          {/* Pinned: Studio header + Now Playing + Create */}
          <div className="shrink-0">
            <div className="text-[11px] font-bold tracking-[.13em] text-[#938b7c] uppercase px-[18px] pt-4 pb-2.5">
              Studio
            </div>

            {/* NOW PLAYING */}
            {currentAudio && (
              <div className="relative">
                <NowPlayingDock
                  artifact={currentAudio} playing={audioPlaying}
                  currentTime={audioTime} duration={audioDuration}
                  onPlayPause={togglePlayPause} onSeek={seekAudio} onDismiss={dismissAudio}
                />
              </div>
            )}

            {/* CREATE */}
            <div className="text-[11px] font-bold tracking-[.13em] text-[#938b7c] uppercase px-[18px] pt-4 pb-2.5">
              Create
            </div>
            <CreateGrid activeIds={activeIds} generatingType={generatingType} onGenerate={handleGenerate} />
          </div>

          {/* Scrollable: This session */}
          <div className="flex-1 min-h-0 overflow-y-auto">
            <div className="flex items-center justify-between px-[18px] pt-4 pb-2.5">
              <span className="text-[11px] font-bold tracking-[.13em] text-[#938b7c] uppercase">This session</span>
              {artifacts.length > 0 && (
                <span className="bg-[#e8e8e6] dark:bg-[#1f1f1f] text-[#5c564c] dark:text-[#c4b99a] text-[10.5px] px-2 py-[2px] rounded-full">
                  {artifacts.length}
                </span>
              )}
            </div>
            <ArtifactHistory
              artifacts={artifacts}
              onOpen={handleOpenArtifact}
              onRename={setRenamingId}
              onDelete={id => { persistArtifacts(artifacts.filter(a => a.id !== id)); if (currentAudio?.id === id) dismissAudio() }}
              onRetry={a => { persistArtifacts(artifacts.filter(x => x.id !== a.id)); handleGenerate(a.type) }}
              renamingId={renamingId}
              onRenameSubmit={handleRenameSubmit}
            />
            <div className="pb-4" />
          </div>
        </div>

      </div>

      {addOpen && (
        <AddSourceDialog onClose={() => setAddOpen(false)} onAdded={note => setNotes(prev => [note, ...prev])} />
      )}
    </div>
  )
}
