'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
  Headphones, Layers, HelpCircle, Monitor, BookOpen,
  PenLine, FileText, ImageIcon, Check,
  X, Upload, RotateCcw, Play, Pause, Plus, ArrowUp,
  Sparkles, Zap, MoreHorizontal, ChevronRight, History, Menu,
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
import { formatTimeAgo } from '@/lib/utils'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Button } from '@/components/ui/button'
import type { StudentNote } from '@/lib/actions/student-notes'
import { submitStudentNote, uploadStudentNote } from '@/lib/actions/student-notes'
import {
  generateAudioOverview,
  renameArtifact,
  createArtifactNotification,
} from '@/lib/actions/student-dashboard'
import type { SubjectProgress } from '@/lib/actions/student-dashboard'
import { getStudentPaceSettings, setMyAssistantName } from '@/lib/actions/study-plans'
import {
  listAssistantArtifacts,
  generateStudioArtifact,
  getAssistantArtifact,
  createAssistantArtifact,
  updateAssistantArtifact,
} from '@/lib/actions/assistant'
import { useTracyChatStream } from '@/hooks/use-tracy-chat-stream'
import {
  ARTIFACT_RE, CONFIRM_RE, NEXT_RE, WIDGET_RE, NEXT_RE_IN_WIDGET,
  extractJson,
} from '@/components/tracy/tracy-protocol'
import { AssistantMessage, UserMessage } from '@/components/tracy/chat-message'
import {
  useChatAttachments, AttachButton, PendingAttachmentChips, SentAttachmentChips, type SentAttachment,
} from '@/components/tracy/chat-attachment-picker'
import { WidgetRenderer } from '@/components/tracy/widget-renderer'
import { buildGreeting, type Greeting } from '@/components/tracy/greeting'
import { publishAssistantName, useAssistantName } from '@/hooks/use-assistant-name'
import { GenerativeUI, EMPTY_QUIZ_DRAFT, type QuizDraft } from '@/components/tracy/generative-ui'
import { parseGenerativeUi, stripUiMarker, type GenerativeUi } from '@/components/tracy/generative-ui-protocol'
import { getTracyChatHistory } from '@/lib/actions/assistant-history'
import { groupServerConversations, toRows, type ServerConversation } from '@/components/tracy/server-history'
import { EditMessageButton, UserMessageEditor } from '@/components/tracy/edit-user-message'
import type { TracyAttachmentRef } from '@/components/tracy/chat-attachments'
import { UsageRemainingBanner } from '@/components/tracy/usage-remaining-banner'
import { StudioArtifactViewer, type ViewerState } from '@/components/tracy/studio-artifact-viewer'
import { noPasteProps } from '@/lib/no-paste'

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
  /** Studio content is stored on the artifact and opened in-chat. */
  hasContent?:   boolean
  sourceNoteIds: string[]
  sourceLabels:  string[]
  createdAt:     string
}

interface Message {
  id:        string
  role:      'user' | 'tracy'
  content:   string
  timestamp: Date
  /** Photos/PDFs the student sent with this message. */
  attachments?: SentAttachment[]
  isLoading?: boolean
  /** Tools Tracy used to produce this reply, kept for the collapsed trace row. */
  tools?:    ToolStatus[]
  /** Inline visual (score card, chart…) Tracy attached to this reply. */
  widgetHtml?: string
  /** Tappable choices Tracy offered (topic picker, next steps). `value` is sent as the next message. */
  nextOptions?: { label: string; value: string }[]
  /** A typed component Tracy chose for this reply (topic picker, quiz question…). */
  ui?: GenerativeUi
  /** Set only when the server confirmed it saved this answer's result against its syllabus outcome. */
  saved?: { outcome: string; correct: boolean; attempted: number; achieved: number; mastered: boolean }
  /** Set only when the server confirmed this question passed its syllabus checks. */
  quizVerified?: boolean
  /** assistant_messages row id, once Tracy has saved this turn — needed to edit it. */
  serverId?: string
  /** Uploaded files sent with this message, kept so an edit can re-send them. */
  attachmentRefs?: TracyAttachmentRef[]
}

interface ToolStatus {
  name:   string
  label:  string
  status: 'running' | 'done' | 'failed'
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
  const assistantName = useAssistantName()

  return (
    <div className={`flex flex-col h-full bg-[#f6f6f5] dark:bg-[#141414] border-r border-[#e2e2df] dark:border-[#2a2a2a] ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between px-[18px] pt-[18px] pb-3 shrink-0">
        <span className="text-[12px] text-[#938b7c]">Notes and PDFs {assistantName} can use</span>
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
              Add notes or upload PDFs to ground {assistantName} in your study materials
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

  const ago = formatTimeAgo(artifact.createdAt)

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
            <span className="text-[11px] font-semibold text-[#8a6713] dark:text-[#c9a03c] bg-[#f5f0e4] dark:bg-[#2a2315] px-[7px] py-[2px] rounded-full">Generating…</span>
          )}
          {artifact.status === 'ready' && (
            <span className="text-[11px] font-semibold text-[#4f7d3f] dark:text-[#7dba6a] bg-[#eaf2e3] dark:bg-[#152118] px-[7px] py-[2px] rounded-full">Ready</span>
          )}
          {artifact.status === 'failed' && (
            <>
              <span className="text-[11px] font-semibold text-[#a23a2c] bg-[#f7e3e0] px-[7px] py-[2px] rounded-full">Failed</span>
              <button onClick={e => { e.stopPropagation(); onRetry(artifact) }}
                className="text-[11px] font-semibold text-[#b88a1f] hover:text-[#8a6713] transition-colors">Retry</button>
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

// ── MessageBubble ─────────────────────────────────────────────────────────────

function MessageBubble({ message, activeIds, onGenerateChip, toolStatuses, isLast, onPickOption, onOpenQuiz, quizSent, onEdit, editDisabled }: {
  message:        Message
  activeIds:      Set<string>
  onGenerateChip: (type: ArtifactType) => void
  toolStatuses?:  ToolStatus[]
  isLast?:        boolean
  onPickOption?:  (value: string) => void
  onOpenQuiz?:    () => void
  quizSent?:      boolean
  /** Set on the student's own saved messages: replace this message and re-ask Tracy. */
  onEdit?:        (text: string) => void
  editDisabled?:  boolean
}) {
  const [editing, setEditing] = useState(false)
  const isUser  = message.role === 'user'
  const content = message.content.replace(/\bNEXT:\s*/g, '').trim()

  if (isUser && editing && onEdit) {
    const hasFiles = !!message.attachments?.length
    return (
      <UserMessageEditor
        initial={content}
        hasAttachments={hasFiles ? (message.attachmentRefs?.length ? 'kept' : 'dropped') : undefined}
        onCancel={() => setEditing(false)}
        onSave={text => { setEditing(false); onEdit(text) }}
      />
    )
  }
  if (isUser) return (
    <div className="group">
      <UserMessage><SentAttachmentChips files={message.attachments} />{content}</UserMessage>
      {onEdit && (
        <div className="mt-1 flex justify-end sm:opacity-0 sm:group-hover:opacity-100 sm:focus-within:opacity-100 transition-opacity">
          <EditMessageButton onClick={() => setEditing(true)} disabled={editDisabled} />
        </div>
      )}
    </div>
  )

  const chipType = activeIds.size > 0 && content && !message.isLoading ? detectChipType(content) : null
  return (
    <AssistantMessage
      content={content}
      streaming={!!message.isLoading}
      tools={message.isLoading ? toolStatuses : message.tools}
    >
      {message.saved && (
        <p className="mt-2 inline-flex flex-wrap items-center gap-x-1.5 text-[12px] text-muted-foreground">
          <Check className="h-3.5 w-3.5 text-[#4f7d3f]" strokeWidth={2.5} />
          <span>Saved to your progress</span>
          <span aria-hidden>·</span>
          <span>{message.saved.achieved}/{message.saved.attempted} on this outcome</span>
          {message.saved.mastered && <span className="font-semibold text-[#4f7d3f]">· mastered</span>}
        </p>
      )}
      {message.ui && onPickOption && (
        <div className="mt-3">
          <GenerativeUI
            ui={message.ui} active={!!isLast} onSend={onPickOption}
            variant="inline" onOpen={onOpenQuiz}
            draft={quizSent ? { ...EMPTY_QUIZ_DRAFT, sent: true } : undefined}
          />
        </div>
      )}
      {isLast && message.nextOptions && message.nextOptions.length > 0 && onPickOption && (
        <div className="mt-3">
          <div className="flex flex-wrap gap-2">
            {message.nextOptions.map(opt => (
              <button key={opt.label} onClick={() => onPickOption(opt.value)}
                className="rounded-md border border-border bg-background px-3 py-1.5 text-[13px] font-medium text-foreground transition-colors hover:border-[#b88a1f]/50 hover:bg-[#b88a1f]/10">
                {opt.label}
              </button>
            ))}
          </div>
          <p className="mt-2 text-[11.5px] text-muted-foreground">Or type anything you like in the box below.</p>
        </div>
      )}
      {message.widgetHtml && (
        <div className="mt-3 w-full overflow-hidden rounded-lg border border-border">
          <WidgetRenderer html={message.widgetHtml} messageId={message.id} />
        </div>
      )}
      {chipType && (
        <div className="mt-3">
          <button onClick={() => onGenerateChip(chipType)}
            className="inline-flex items-center gap-2 text-[12.5px] font-semibold text-[#8a6713] dark:text-[#c9a03c] bg-white dark:bg-[#181818] border border-[#ecdfc2] dark:border-[#3d3020] px-3 py-[7px] rounded-[10px] hover:shadow-sm transition-all">
            <Zap className="h-3.5 w-3.5" strokeWidth={1.8} />
            Generate {ARTIFACT_CONFIG[chipType].label} →
          </button>
        </div>
      )}
    </AssistantMessage>
  )
}

// ── Main: StudentTracyPage ────────────────────────────────────────────────────

type AsidePanel = 'sources' | 'studio' | 'history' | 'quiz'

const ASIDE_TITLES: Record<AsidePanel, string> = {
  sources: 'Sources',
  studio:  'Studio',
  history: 'History',
  quiz:    'Question',
}

export function StudentTracyPage({ user, weakSubjects, currentTopics, initialNotes, initialPrompt }: {
  user:            any
  weakSubjects:    string[]
  currentTopics:   string[]
  subjectProgress: SubjectProgress[]
  initialNotes:    StudentNote[]
  /** Pre-fills the composer when a student arrives via a contextual "Ask Tracy"
   *  deep link (e.g. from an at-risk subject badge or a misconception-redirect
   *  scene) instead of landing on a blank chat. */
  initialPrompt?:  string
}) {
  const router = useRouter()

  const [messages,     setMessages]     = useState<Message[]>([])
  const [pastChats,    setPastChats]    = useState<ServerConversation[]>([])
  const [input,        setInput]        = useState('')
  const [streaming,    setStreaming]    = useState(false)
  const [toolStatuses, setToolStatuses] = useState<ToolStatus[]>([])

  // Free-tier messages left, surfaced from Tracy's `done` event. null means
  // "unknown yet" (no reply received) — distinct from a paid user, who never
  // gets this field at all and so never sees the banner below.
  const [usageRemaining, setUsageRemaining] = useState<number | null>(null)

  const [notes,     setNotes]     = useState<StudentNote[]>(initialNotes)
  const [activeIds, setActiveIds] = useState<Set<string>>(new Set())
  const [addOpen,   setAddOpen]   = useState(false)

  const [artifacts,      setArtifacts]      = useState<Artifact[]>([])
  const [currentAudio,   setCurrentAudio]   = useState<Artifact | null>(null)
  const [audioPlaying,   setAudioPlaying]   = useState(false)
  const [audioTime,      setAudioTime]      = useState(0)
  const [audioDuration,  setAudioDuration]  = useState(0)
  const [generatingType, setGeneratingType] = useState<ArtifactType | null>(null)
  // The studio artifact open in the in-chat viewer (null = closed).
  const [viewer, setViewer] = useState<(ViewerState & { id: string }) | null>(null)
  const [renamingId,     setRenamingId]     = useState<string | null>(null)
  const [inputFocused,   setInputFocused]   = useState(false)
  // One side panel at a time (sources / studio / history / the current quiz question).
  // Closed by default so the chat gets the full width; below lg it is a full-screen sheet.
  // Time-aware greeting; computed after mount so server and browser clocks can't disagree.
  const [greeting, setGreeting] = useState<Greeting | null>(null)
  useEffect(() => {
    setGreeting(buildGreeting({ name: user?.name, streak: user?.study_streak }))
  }, [user?.name, user?.study_streak])

  const [aside,       setAside]       = useState<AsidePanel | null>(null)
  const [quizId,      setQuizId]      = useState<string | null>(null)
  const [quizDrafts,  setQuizDrafts]  = useState<Record<string, QuizDraft>>({})
  // Readable from sendMessage's closure: has the open question been answered yet?
  const quizSentRef = useRef(false)
  useEffect(() => {
    quizSentRef.current = !!(quizId && quizDrafts[quizId]?.sent)
  }, [quizId, quizDrafts])

  function openAside(panel: AsidePanel | null) {
    setAside(panel)
    if (panel === 'history') refreshPastChats()
  }

  function togglePanel(which: 'sources' | 'studio', next?: boolean) {
    setAside(prev => ((next ?? prev !== which) ? which : prev === which ? null : prev))
  }

  const tracyStream = useTracyChatStream()
  const attach = useChatAttachments()
  const bottomRef   = useRef<HTMLDivElement>(null)
  const audioRef    = useRef<HTMLAudioElement | null>(null)
  const inputRef    = useRef<HTMLInputElement>(null)
  const sessionIdRef = useRef<string>(crypto.randomUUID())

  const userId    = user?.user_id ?? user?.id ?? 'anon'
  const STORE_KEY = `tracy_artifacts_${userId}`

  // Personalised assistant name (item 17) — click the header title to rename.
  const assistantName = useAssistantName()
  const [renameOpen,    setRenameOpen]    = useState(false)
  const [renameDraft,   setRenameDraft]   = useState('')
  const [savingName,    setSavingName]    = useState(false)

  // The page metadata is static server-side, so the tab title follows the name here.
  useEffect(() => {
    document.title = `${assistantName} — Learning Companion`
  }, [assistantName])

  useEffect(() => {
    // localStorage first for an instant paint, then the server list — the
    // authoritative source now that artifacts persist server-side —
    // reconciles it. Keeps this working offline/on API hiccups (stale local
    // list) while fixing the real bug (list was localStorage-only, so a new
    // device or a cleared cache showed nothing despite the content still
    // existing server-side via plan_id/audio_url).
    try {
      const raw = localStorage.getItem(STORE_KEY)
      if (raw) setArtifacts(JSON.parse(raw) as Artifact[])
    } catch {}

    listAssistantArtifacts().then(({ data }) => {
      if (!data) return
      const mapped: Artifact[] = data.map((a) => ({
        id: a.id,
        type: a.type,
        title: a.title,
        status: a.status,
        plan_id: a.plan_id ?? undefined,
        audio_url: a.audio_url ?? undefined,
        hasContent: !!a.has_content,
        sourceNoteIds: a.source_note_ids,
        sourceLabels: a.source_labels,
        createdAt: a.createdAt,
      }))
      persistArtifacts(mapped)
    }).catch(() => {})
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (userId === 'anon') return
    getStudentPaceSettings(userId).then(({ data }) => {
      if (data?.assistant_name) publishAssistantName(data.assistant_name)
    })
  }, [userId])

  function handleSaveName() {
    if (savingName) return
    const trimmed = renameDraft.trim()
    setSavingName(true)
    setMyAssistantName(trimmed || null).then(({ data, error }) => {
      setSavingName(false)
      if (error) { toast.error(error.message ?? 'Could not rename assistant'); return }
      publishAssistantName(data?.assistant_name ?? null) // updates the menu and every page showing the name
      setRenameOpen(false)
      toast.success(trimmed ? `Now called ${trimmed}` : 'Reset to Tracy')
    })
  }

  useEffect(() => {
    // Scroll the message list only. scrollIntoView() also scrolls every scrollable
    // ancestor — including the page itself — which is what dragged the whole app up.
    const box = bottomRef.current?.parentElement
    box?.scrollTo({ top: box.scrollHeight, behavior: 'smooth' })
  }, [messages])

  useEffect(() => {
    if (initialPrompt) setInput(initialPrompt)
   
  }, [initialPrompt])

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
    if (activeIds.size === 0) { toast.error('Select at least one source first.'); togglePanel('sources', true); return }
    if (!activeSubject || !activeTopic) { toast.error('Activate a source to set subject and topic.'); togglePanel('sources', true); return }
    togglePanel('studio', true)
    if (type !== 'audio_overview') {
      await buildStudio(type, {
        subject: activeSubject,
        topic: activeTopic,
        sourceIds: Array.from(activeIds),
        sourceLabels: activeNotes.map(n => n.topic),
      })
      return
    }

    const tempId       = crypto.randomUUID()
    const sourceIds    = Array.from(activeIds)
    const title        = autoTitle(type, activeTopic)
    const sourceLabels = activeNotes.map(n => n.topic)

    const newArt: Artifact = {
      id: tempId, type, status: 'generating',
      title,
      sourceNoteIds: sourceIds,
      sourceLabels,
      createdAt: new Date().toISOString(),
    }

    persistArtifacts([newArt, ...artifacts])
    setGeneratingType(type)

    // Create the server-side index record in parallel with generation —
    // swap the local temp id for the real one once it comes back, so the
    // status/plan_id/audio_url updates below land on the right row both
    // locally and server-side, regardless of which call finishes first.
    let realId: string | null = null
    const createPromise = createAssistantArtifact({
      type, title, status: 'generating', source_note_ids: sourceIds, source_labels: sourceLabels,
    }).then(({ data }) => {
      if (!data) return
      realId = data.id
      setArtifacts(prev => {
        const next = prev.map(a => a.id === tempId ? { ...a, id: data.id } : a)
        try { localStorage.setItem(STORE_KEY, JSON.stringify(next)) } catch {}
        return next
      })
    }).catch(() => {})

    const currentId = () => realId ?? tempId

    try {
      if (type === 'audio_overview') {
        const res = await generateAudioOverview(activeSubject, activeTopic, sourceIds)
        await createPromise
        if (res.error) {
          updateArtifact(currentId(), { status: 'failed' })
          if (realId) void updateAssistantArtifact(realId, { status: 'failed' })
          toast.error(res.error.message); return
        }
        const url = res.data?.audio_url ?? null
        updateArtifact(currentId(), { status: 'ready', audio_url: url ?? undefined })
        if (realId) void updateAssistantArtifact(realId, { status: 'ready', audio_url: url })
        if (url) loadAndPlayAudio({ ...newArt, id: currentId(), status: 'ready', audio_url: url })
        else toast.info('Audio generation is not currently configured.')
      }
      if (document.hidden) {
        try { await createArtifactNotification(autoTitle(type, activeTopic)) } catch {}
      }
    } catch {
      updateArtifact(currentId(), { status: 'failed' })
      if (realId) void updateAssistantArtifact(realId, { status: 'failed' })
      toast.error('Generation failed — please try again.')
    } finally {
      setGeneratingType(null)
    }
  }

  // Studio (flashcards / quiz / slides / guide): built from the student's own
  // notes, stored on the artifact, and opened in a viewer OVER the chat — the
  // student never leaves the conversation they're in.
  async function buildStudio(
    type: StudioType,
    src: { subject: string; topic: string; sourceIds: string[]; sourceLabels: string[] },
    retryOf?: Artifact,
  ) {
    const tempId = retryOf?.id ?? crypto.randomUUID()
    const title  = retryOf?.title ?? autoTitle(type, src.topic)
    const pending: Artifact = {
      id: tempId, type, title, status: 'generating',
      sourceNoteIds: src.sourceIds, sourceLabels: src.sourceLabels,
      createdAt: retryOf?.createdAt ?? new Date().toISOString(),
    }
    persistArtifacts(retryOf ? artifacts.map(a => a.id === tempId ? pending : a) : [pending, ...artifacts])
    setGeneratingType(type)
    try {
      const { data, error } = await generateStudioArtifact({
        type, subject: src.subject, topic: src.topic, title,
        source_note_ids: src.sourceIds, source_labels: src.sourceLabels,
        // The server creates the row with this id if it doesn't exist yet, so a
        // failed attempt and its retry (or a legacy rebuild) stay one artifact.
        artifact_id: tempId,
      })
      if (error || !data) {
        updateArtifact(tempId, { status: 'failed' })
        toast.error(error?.message ?? 'Could not build that — please try again.')
        return
      }
      setArtifacts(prev => {
        const next = prev.map(a => a.id === tempId
          ? { ...a, id: data.id, status: 'ready' as const, hasContent: true, plan_id: undefined }
          : a)
        try { localStorage.setItem(STORE_KEY, JSON.stringify(next)) } catch {}
        return next
      })
      toast.success(`${ARTIFACT_CONFIG[type].label} ready`)
      if (data.content) setViewer({ id: data.id, title, type, sourceLabels: src.sourceLabels, content: data.content })
      if (document.hidden) {
        try { await createArtifactNotification(title) } catch {}
      }
    } catch {
      updateArtifact(tempId, { status: 'failed' })
      toast.error('Generation failed — please try again.')
    } finally {
      setGeneratingType(null)
    }
  }

  /** Subject/topic for an existing artifact, recovered from its source notes. */
  function sourcesOf(a: Artifact) {
    const src = notes.filter(n => a.sourceNoteIds.includes(n.id))
    if (!src.length) return null
    return { subject: src[0].subject, topic: src[0].topic, sourceIds: src.map(n => n.id), sourceLabels: src.map(n => n.topic) }
  }

  async function handleRetry(a: Artifact) {
    if (a.type === 'audio_overview') {
      persistArtifacts(artifacts.filter(x => x.id !== a.id))
      handleGenerate(a.type)
      return
    }
    const src = sourcesOf(a)
    if (!src) { toast.error('The notes this was built from are no longer available.'); return }
    await buildStudio(a.type, src, a)
  }

  async function handleOpenArtifact(artifact: Artifact) {
    if (artifact.type === 'audio_overview') {
      if (artifact.audio_url) loadAndPlayAudio(artifact)
      return
    }
    const base = { id: artifact.id, title: artifact.title, type: artifact.type, sourceLabels: artifact.sourceLabels }
    // Legacy rows were lesson plans (now behind curriculum review) — offer an
    // in-place rebuild instead of navigating away to a lesson that may be locked.
    if (!artifact.hasContent) { setViewer({ ...base, content: 'legacy' }); return }
    setViewer({ ...base, content: null })
    const { data, error } = await getAssistantArtifact(artifact.id)
    if (error || !data?.content) {
      setViewer(null)
      toast.error(error?.message ?? 'Could not open that — try again.')
      return
    }
    setViewer(v => (v && v.id === artifact.id ? { ...v, content: data.content! } : v))
  }

  async function handleRebuildFromViewer() {
    if (!viewer) return
    const a = artifacts.find(x => x.id === viewer.id)
    const src = a ? sourcesOf(a) : null
    if (!a || !src) { toast.error('The notes this was built from are no longer available.'); return }
    setViewer(null)
    await buildStudio(a.type as StudioType, src, a)
  }

  async function handleRenameSubmit(id: string, title: string) {
    setRenamingId(null)
    if (!title.trim()) return
    updateArtifact(id, { title: title.trim() })
    const artifact = artifacts.find(a => a.id === id)
    if (artifact?.plan_id) await renameArtifact(artifact.plan_id, title.trim())
    void updateAssistantArtifact(id, { title: title.trim() })
  }

  async function sendMessage(text: string, edit?: { messageId: string; refs?: TracyAttachmentRef[]; sent?: SentAttachment[] }) {
    // An edit re-asks with the edited text and the original's files; the
    // composer (and anything attached there) is left for the next message.
    if (streaming) return
    if (!edit) {
      if (!text.trim() && !attach.ready) return
      if (attach.uploading) { toast('Hang on, your file is still uploading…'); return }
    } else if (!text.trim()) return
    const { refs: attachmentRefs, sent: sentFiles } = edit
      ? { refs: edit.refs ?? [], sent: edit.sent ?? [] }
      : attach.take()
    if (!edit) setInput('')
    // Once the question has been answered, any new message that isn't the answer itself
    // (a new topic, "another one"…) clears the old question from the side panel.
    // An unanswered question stays put, so the student can ask for help while it is open.
    if (quizSentRef.current && !text.startsWith('My answer:')) {
      setAside(prev => (prev === 'quiz' ? null : prev))
    }
    setToolStatuses([])

    const userMsg:    Message = {
      id: crypto.randomUUID(), role: 'user', content: text, timestamp: new Date(),
      attachments: sentFiles.length ? sentFiles : undefined,
      attachmentRefs: attachmentRefs.length ? attachmentRefs : undefined,
    }
    const loadingMsg: Message = { id: crypto.randomUUID(), role: 'tracy', content: '',   timestamp: new Date(), isLoading: true }
    setMessages(prev => [...prev, userMsg, loadingMsg])
    setStreaming(true)

    let accumulated = ''
    // Mirror of toolStatuses that the `done` handler can read (state is stale inside this closure).
    let trace: ToolStatus[] = []

    const onEvent = (ev: any) => {
      switch (ev.type) {
        case 'tool_call':
          if (!trace.find(t => t.name === ev.name && t.status === 'running'))
            trace = [...trace, { name: ev.name, label: ev.label, status: 'running' }]
          setToolStatuses(prev => {
            if (prev.find(t => t.name === ev.name && t.status === 'running')) return prev
            return [...prev, { name: ev.name, label: ev.label, status: 'running' }]
          })
          break
        case 'tool_result':
          trace = trace.map(t => t.name === ev.name && t.status === 'running'
            ? { ...t, status: ev.success ? 'done' : 'failed' }
            : t)
          setToolStatuses(prev =>
            prev.map(t => t.name === ev.name && t.status === 'running'
              ? { ...t, status: ev.success ? 'done' : 'failed' }
              : t)
          )
          break
        case 'reset':
          // The server rejected the question it was streaming and is writing a corrected one.
          accumulated = ''
          setMessages(p => p.map(m => m.isLoading ? { ...m, content: '' } : m))
          break
        case 'quiz_verified':
          setMessages(p => p.map(m => m.isLoading ? { ...m, quizVerified: true } : m))
          break
        case 'practice_saved':
          setMessages(p => p.map(m => m.isLoading
            ? { ...m, saved: { outcome: ev.outcome, correct: ev.correct, attempted: ev.attempted, achieved: ev.achieved, mastered: ev.mastered } }
            : m))
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
          break
        }
        case 'done': {
          const ids = ev.messageIds as { user?: string; assistant?: string } | undefined
          if (ids?.user || ids?.assistant) {
            setMessages(p => p.map(m =>
              m.id === userMsg.id ? { ...m, serverId: ids.user ?? m.serverId }
              : m.id === loadingMsg.id ? { ...m, serverId: ids.assistant ?? m.serverId }
              : m))
          }
          const rawReply = (accumulated || ev.reply || '').replace(/^[ \t]*__RESULT__[ \t]*:[^\n]*$/gm, '').trim()
          // A typed UI payload (topic picker, quiz question…) becomes a real component;
          // if it is malformed the marker is stripped so raw JSON never reaches the chat.
          const uiParsed = parseGenerativeUi(rawReply)
          const reply = uiParsed ? uiParsed.text : stripUiMarker(rawReply)
          if (uiParsed) {
            setMessages(p => p.map(m => m.isLoading
              ? { ...m, content: uiParsed.text, isLoading: false, ui: uiParsed.ui, tools: trace.length ? trace : undefined }
              : m))
            setToolStatuses([])
            if (uiParsed.ui.component === 'quiz_question') { setQuizId(loadingMsg.id); setAside('quiz') }
            if (typeof ev.usageRemaining === 'number') setUsageRemaining(ev.usageRemaining)
            accumulated = ''
            break
          }

          // Strip CONFIRM / NEXT / ARTIFACT markers from displayed text
          const confirmMatch = reply.match(CONFIRM_RE)
          const artifactMatch = reply.match(ARTIFACT_RE)
          const nextMatch = reply.match(NEXT_RE)

          // Inline widget: keep the HTML out of the text bubble and render it as a card.
          const widgetMatch = reply.match(WIDGET_RE)
          if (widgetMatch) {
            const before = reply.slice(0, Math.max(reply.search(WIDGET_RE), 0)).trim()
            let html = widgetMatch[1]
            const nextInWidget = html.match(NEXT_RE_IN_WIDGET)
            if (nextInWidget) html = html.slice(0, html.search(NEXT_RE_IN_WIDGET)).trim()
            setMessages(p => p.map(m => m.isLoading
              ? { ...m, content: before, isLoading: false, widgetHtml: html, tools: trace.length ? trace : undefined }
              : m))
            setToolStatuses([])
            if (typeof ev.usageRemaining === 'number') setUsageRemaining(ev.usageRemaining)
            accumulated = ''
            break
          }

          let nextOptions: { label: string; value: string }[] | undefined
          if (nextMatch) {
            const nj = extractJson(nextMatch[1])
            try {
              const opts = nj ? JSON.parse(nj)?.options : null
              if (Array.isArray(opts)) {
                nextOptions = opts
                  .filter((o: any) => o && typeof o.label === 'string')
                  .slice(0, 8)
                  // A value with no spaces ("practice_mode") is an internal id, not something a student
                  // would say — send the readable label instead so the chat shows what they tapped.
                  .map((o: any) => ({
                    label: o.label,
                    value: typeof o.value === 'string' && /\s/.test(o.value.trim()) ? o.value : o.label,
                  }))
              }
            } catch { /* malformed options — show the text without chips */ }
          }

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
            display = reply.slice(0, reply.search(NEXT_RE)).trim()
            // Tracy sometimes emits __NEXT__: as the entire reply with no lead-in
            // text — fall back to its own "message" field rather than dumping the
            // raw "NEXT:{...}" JSON into the chat bubble.
            if (!display) {
              const json = extractJson(nextMatch[1])
              const parsed = json ? (() => { try { return JSON.parse(json) } catch { return null } })() : null
              display = parsed?.message || ''
            }
          }

          // Tracy occasionally emits only a bare marker (e.g. "__NEXT__:" with no
          // payload and nothing before it) — that shape doesn't match any regex
          // above (they all require a `{` payload), so `display` falls through to
          // the raw marker text. Strip any leftover bare marker and fall back to a
          // friendly line rather than a blank bubble or a leaked marker fragment.
          const BARE_MARKER_RE = /(?:^|\n)\s*(?:__)?(?:NEXT|CONFIRM|ARTIFACT)(?:__)?\s*:\s*$/
          const cleaned = (display || reply).replace(BARE_MARKER_RE, '').trim()
          const finalContent = cleaned || "I don't have anything more to add there — what would you like to do next?"

          setMessages(p => p.map(m => m.isLoading ? { ...m, content: finalContent, isLoading: false, tools: trace.length ? trace : undefined, nextOptions } : m))
          setToolStatuses([])
          if (typeof ev.usageRemaining === 'number') setUsageRemaining(ev.usageRemaining)
          accumulated = ''
          break
        }
      }
    }

    try {
      await tracyStream.stream(
        // A blank chat starts clean; a chat restored from History keeps its saved context.
        {
          message: text, sessionId: sessionIdRef.current, mode: 'student', sourceIds: Array.from(activeIds), freshChat: messages.length === 0,
          ...(attachmentRefs.length ? { attachments: attachmentRefs } : {}),
          ...(edit ? { editMessageId: edit.messageId } : {}),
        },
        onEvent,
      )
    } catch (err: any) {
      if (err?.name === 'AbortError') return
      toast.error('Sorry, I had trouble responding. Please try again.')
      setMessages(p => p.filter(m => !m.isLoading))
      setToolStatuses([])
    } finally { setStreaming(false) }
  }

  // Past conversations come from the server (Tracy persists every turn), so
  // they follow the student across browsers and survive cleared site data.
  function refreshPastChats() {
    getTracyChatHistory().then(({ data }) => {
      const convos = groupServerConversations(toRows(data)).sort((a, b) => b.updatedAt - a.updatedAt)
      setPastChats(convos.slice(0, 30))
    }).catch(() => {})
  }

  useEffect(() => { refreshPastChats() }, [])

  // Edit a sent message: drop it and everything after it, then ask again.
  // Tracy deletes the same turns server-side (editMessageId), so History matches.
  function editMessage(messageId: string, text: string) {
    if (streaming) return
    const idx = messages.findIndex(m => m.id === messageId)
    const original = messages[idx]
    if (idx < 0 || !original?.serverId) return
    if (quizId && messages.slice(idx).some(m => m.id === quizId)) {
      setQuizId(null)
      setAside(prev => (prev === 'quiz' ? null : prev))
    }
    setMessages(prev => {
      const at = prev.findIndex(m => m.id === messageId)
      return at < 0 ? prev : prev.slice(0, at)
    })
    void sendMessage(text, {
      messageId: original.serverId,
      refs: original.attachmentRefs,
      sent: original.attachmentRefs?.length ? original.attachments : undefined,
    })
  }

  function openPastChat(convo: ServerConversation) {
    tracyStream.stop()
    // Keep writing to this same chat, so it stays one entry in History.
    sessionIdRef.current = convo.id
    setMessages(convo.messages)
    setInput(''); setStreaming(false); setToolStatuses([])
    setAside(null)
  }

  function newChat() {
    tracyStream.stop()
    sessionIdRef.current = crypto.randomUUID()
    setMessages([]); setInput(''); setStreaming(false); setToolStatuses([])
    setQuizId(null); setAside(prev => (prev === 'quiz' ? null : prev))
  }

  function fillInput(text: string) {
    setInput(text)
    inputRef.current?.focus()
  }

  const showSuggestions = messages.length === 0
  // Starter cards come from what we really know about this student, so they are useful on
  // day one (no profile or results needed): one always starts the guided quiz, the other
  // follows their sources, their weak spot, or this week's topic.
  const suggestions = [
    'Quiz me on my syllabus',
    activeNotes.length > 0
      ? `Summarize the key points of ${activeTopic}`
      : weakSubjects[0]
      ? `Help me get stronger in ${weakSubjects[0]}`
      : currentTopics[0]
      ? `Help me understand ${currentTopics[0]}`
      : 'Make me a revision plan for this week',
  ]

  return (
    <div className="h-full bg-[#f2f2f1] dark:bg-[#111111] p-3 lg:p-4">
      {/* App card */}
      <div className="h-full flex flex-col lg:grid bg-white dark:bg-[#181818] border border-[#e2e2df] dark:border-[#2a2a2a] rounded-[22px] overflow-hidden"
        style={{
          boxShadow: '0 2px 6px rgba(42,39,34,.07), 0 18px 40px rgba(42,39,34,.10)',
          gridTemplateColumns: aside ? 'minmax(0,1fr) 400px' : 'minmax(0,1fr)',
        }}>

        {/* ── Chat ── */}
        <div className="flex flex-col flex-1 min-h-0 bg-white dark:bg-[#181818] min-w-0">

          {/* Chat header */}
          <div className="flex items-center justify-between px-[22px] py-[15px] border-b border-[#e8e8e6] dark:border-[#1f1f1f] shrink-0">
            <div className="flex items-center gap-[11px] min-w-0">
              <div className="w-[38px] h-[38px] rounded-[11px] bg-[#f5f0e4] dark:bg-[#2a2315] flex items-center justify-center text-[#8a6713] dark:text-[#c9a03c] shrink-0">
                <Sparkles className="h-[18px] w-[18px]" strokeWidth={1.8} />
              </div>
              <div className="min-w-0">
                <Popover open={renameOpen} onOpenChange={(open) => { setRenameOpen(open); if (open) setRenameDraft(assistantName === 'Tracy' ? '' : assistantName) }}>
                  <PopoverTrigger asChild>
                    <button className="m-0 text-[17px] font-semibold tracking-[-0.01em] text-[#2a2722] dark:text-[#f4ead8] leading-tight hover:opacity-70 transition-opacity"
                      style={{ fontFamily: "'Fraunces', Georgia, serif" }}>
                      {assistantName}
                    </button>
                  </PopoverTrigger>
                  <PopoverContent className="w-64 space-y-2" align="start">
                    <Label htmlFor="assistant-name-input" className="text-xs text-muted-foreground">
                      Name your assistant
                    </Label>
                    <Input
                      id="assistant-name-input"
                      value={renameDraft}
                      onChange={(e) => setRenameDraft(e.target.value)}
                      placeholder="Tracy"
                      maxLength={30}
                      className="text-sm"
                    />
                    <div className="flex justify-end gap-2">
                      <Button size="sm" variant="ghost" onClick={() => setRenameOpen(false)}>Cancel</Button>
                      <Button size="sm" onClick={handleSaveName} disabled={savingName} className="bg-gold hover:bg-gold/90 text-gold-foreground">
                        {savingName ? 'Saving…' : 'Save'}
                      </Button>
                    </div>
                  </PopoverContent>
                </Popover>
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
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button aria-label="Open menu"
                    className="relative flex h-[34px] w-[34px] items-center justify-center rounded-[10px] border border-[#e2e2df] dark:border-[#2a2a2a] text-[#5c564c] dark:text-[#c4b99a] hover:bg-[#f6f6f5] dark:hover:bg-[#1c1c1c] hover:text-[#2a2722] dark:hover:text-[#f4ead8] transition-colors">
                    <Menu className="h-4 w-4" strokeWidth={1.8} />
                    {(activeIds.size > 0 || artifacts.length > 0) && (
                      <span className="absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full bg-[#b88a1f]" />
                    )}
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuItem onSelect={() => openAside('sources')} className="gap-2.5">
                    <FileText className="h-4 w-4" strokeWidth={1.8} /> Sources
                    {activeIds.size > 0 && <span className="ml-auto rounded-full bg-[#b88a1f]/15 px-1.5 text-[10.5px] text-[#8a6713] dark:text-[#c9a03c]">{activeIds.size}</span>}
                  </DropdownMenuItem>
                  <DropdownMenuItem onSelect={() => openAside('studio')} className="gap-2.5">
                    <Layers className="h-4 w-4" strokeWidth={1.8} /> Studio
                    {artifacts.length > 0 && <span className="ml-auto rounded-full bg-[#b88a1f]/15 px-1.5 text-[10.5px] text-[#8a6713] dark:text-[#c9a03c]">{artifacts.length}</span>}
                  </DropdownMenuItem>
                  <DropdownMenuItem onSelect={() => openAside('history')} className="gap-2.5">
                    <History className="h-4 w-4" strokeWidth={1.8} /> History
                  </DropdownMenuItem>
                  <div className="my-1 h-px bg-border" />
                  <DropdownMenuItem onSelect={newChat} className="gap-2.5">
                    <RotateCcw className="h-4 w-4" strokeWidth={1.8} /> New chat
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          {/* Message stream */}
          <div
            className="flex-1 overflow-y-auto px-[22px] pt-[26px] pb-2 flex flex-col gap-6 [&>*]:w-full [&>*]:max-w-[760px] [&>*]:mx-auto"
            role="log"
            aria-live="polite"
            aria-label={`Conversation with ${assistantName}`}
          >
            {showSuggestions ? (
              <div className="flex h-full flex-col items-center justify-center gap-8 pb-6">
                <div className="text-center">
                  <div className="mx-auto mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-[#f5f0e4] text-[#8a6713] dark:bg-[#2a2315] dark:text-[#c9a03c]">
                    <Sparkles className="h-5 w-5" strokeWidth={1.8} />
                  </div>
                  <h1 className="text-[28px] font-semibold leading-tight tracking-[-0.015em] text-[#2a2722] dark:text-[#f4ead8]"
                    style={{ fontFamily: "'Fraunces', Georgia, serif" }}>
                    {greeting?.headline ?? (user?.name ? `Hi, ${user.name.split(' ')[0]}` : 'Hello')}
                  </h1>
                  <p className="mt-2 text-[14px] text-[#938b7c]">
                    {greeting?.subline ?? 'What would you like to work on?'}
                  </p>
                </div>
                <div className="grid w-full max-w-xl grid-cols-1 gap-3 sm:grid-cols-2">
                  {suggestions.slice(0, 2).map((sug, i) => (
                    <button key={i} onClick={() => sendMessage(sug)}
                      className="flex min-h-[72px] items-center rounded-lg border border-[#e2e2df] bg-white px-4 py-3 text-left text-[13.5px] font-medium leading-snug text-[#5c564c] transition-all hover:border-[#ecdfc2] hover:text-[#2a2722] hover:shadow-[0_1px_2px_rgba(42,39,34,.04),0_8px_24px_rgba(42,39,34,.06)] dark:border-[#2a2a2a] dark:bg-[#181818] dark:text-[#c4b99a] dark:hover:border-[#3d3020] dark:hover:text-[#f4ead8]">
                      {sug}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              messages.map((msg, idx) => (
                <MessageBubble key={msg.id} message={msg} activeIds={activeIds}
                  isLast={idx === messages.length - 1}
                  onPickOption={value => sendMessage(value)}
                  onOpenQuiz={() => { setQuizId(msg.id); setAside('quiz') }}
                  quizSent={!!quizDrafts[msg.id]?.sent}
                  onGenerateChip={type => handleGenerate(type)}
                  onEdit={msg.role === 'user' && msg.serverId ? text => editMessage(msg.id, text) : undefined}
                  editDisabled={streaming}
                  toolStatuses={msg.isLoading ? toolStatuses : undefined} />
              ))
            )}
            <div ref={bottomRef} />
          </div>

          {/* Composer */}
          <div className="px-[22px] pt-3 pb-[18px] border-t border-[#e8e8e6] dark:border-[#1f1f1f] shrink-0">
            <PendingAttachmentChips files={attach.files} onRemove={attach.remove} />
            {/* Input wrapper */}
            <div className={`flex items-center gap-2.5 bg-[#f6f6f5] dark:bg-[#141414] border rounded-[14px] px-4 py-[6px] transition-all ${
              inputFocused
                ? 'border-[#b88a1f] shadow-[0_0_0_3px_#ecdfc2] dark:shadow-[0_0_0_3px_#332b12]'
                : 'border-[#e2e2df] dark:border-[#2a2a2a]'
            }`}>
              <AttachButton onFiles={attach.add} disabled={streaming} className="-ml-2" />
              <input
                ref={inputRef}
                {...noPasteProps('tracy-chat')}
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(input) } }}
                onFocus={() => setInputFocused(true)}
                onBlur={() => setInputFocused(false)}
                placeholder={`Ask ${assistantName} anything…`}
                className="flex-1 border-0 bg-transparent outline-none text-[14px] text-[#2a2722] dark:text-[#f4ead8] placeholder:text-[#938b7c] font-[inherit] py-2"
              />
              <button
                onClick={() => sendMessage(input)}
                disabled={(!input.trim() && !attach.ready) || streaming || attach.uploading}
                className="w-[38px] h-[38px] rounded-[10px] flex items-center justify-center shrink-0 border-0 disabled:opacity-40 disabled:cursor-not-allowed transition-opacity"
                style={{ background: 'linear-gradient(150deg, #b88a1f, #8a6713)', boxShadow: '0 3px 8px rgba(138,103,19,.30)' }}>
                <ArrowUp className="h-4 w-4 text-white" strokeWidth={2} />
              </button>
            </div>
            <UsageRemainingBanner remaining={usageRemaining} />
            <p className="text-center text-[11px] text-[#938b7c] mt-2.5">{assistantName} can make mistakes. Always verify with your teacher.</p>
          </div>
        </div>

        {/* ── Aside: one panel at a time, always on the right ── */}
        {aside && (
          <aside
            aria-label={ASIDE_TITLES[aside]}
            className="fixed inset-0 z-40 flex min-h-0 min-w-0 flex-col bg-[#f6f6f5] dark:bg-[#141414] lg:static lg:inset-auto lg:z-auto lg:border-l lg:border-[#e2e2df] dark:lg:border-[#2a2a2a]"
          >
            <div className="flex shrink-0 items-center justify-between border-b border-[#e2e2df] dark:border-[#2a2a2a] px-[18px] py-3">
              <span className="text-[11px] font-bold uppercase tracking-[.13em] text-[#938b7c]">{ASIDE_TITLES[aside]}</span>
              <button onClick={() => openAside(null)} aria-label="Close panel"
                className="flex h-7 w-7 items-center justify-center rounded-md text-[#938b7c] transition-colors hover:bg-[#e8e8e6] dark:hover:bg-[#1f1f1f] hover:text-[#2a2722] dark:hover:text-[#f4ead8]">
                <X className="h-4 w-4" strokeWidth={1.8} />
              </button>
            </div>

            <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
              {aside === 'sources' && (
                <SourcesPanel
                  notes={notes} activeIds={activeIds}
                  onToggle={toggleSource} onAddClicked={() => setAddOpen(true)}
                  className="!border-r-0"
                />
              )}

              {aside === 'history' && (
                <div className="flex-1 overflow-y-auto p-2">
                  {pastChats.length === 0 ? (
                    <p className="px-3 py-10 text-center text-[12.5px] text-muted-foreground">No past conversations yet</p>
                  ) : pastChats.map(c => (
                    <button key={c.id} onClick={() => openPastChat(c)}
                      className="w-full rounded-lg px-3 py-2.5 text-left transition-colors hover:bg-muted">
                      <p className="truncate text-[13px] font-medium text-foreground">{c.title}</p>
                      <p className="truncate text-[11.5px] text-muted-foreground">{c.lastMessage || 'No reply yet'}</p>
                      <p className="mt-0.5 text-[10.5px] text-muted-foreground/70">
                        {new Date(c.updatedAt).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </button>
                  ))}
                </div>
              )}

              {aside === 'quiz' && (() => {
                const q = messages.find(m => m.id === quizId)
                if (!q?.ui || q.ui.component !== 'quiz_question') {
                  return <p className="px-4 py-10 text-center text-[12.5px] text-muted-foreground">No question open.</p>
                }
                return (
                  <div className="flex-1 overflow-y-auto p-4">
                    <GenerativeUI
                      key={q.id}
                      ui={q.ui}
                      variant="aside"
                      verified={!!q.quizVerified}
                      active={q.id === messages[messages.length - 1]?.id && !streaming}
                      onSend={sendMessage}
                      draft={quizDrafts[q.id] ?? EMPTY_QUIZ_DRAFT}
                      onDraftChange={d => setQuizDrafts(prev => ({ ...prev, [q.id]: d }))}
                    />
                  </div>
                )
              })()}

              {aside === 'studio' && (
                <div className="flex min-h-0 flex-1 flex-col">

          {/* Pinned: Now Playing + Create */}
          <div className="shrink-0">

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

          <StudioArtifactViewer
            state={viewer}
            onClose={() => setViewer(null)}
            onRebuild={handleRebuildFromViewer}
            rebuilding={!!generatingType}
          />

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
              onRetry={handleRetry}
              renamingId={renamingId}
              onRenameSubmit={handleRenameSubmit}
            />
            <div className="pb-4" />
          </div>
                </div>
              )}
            </div>
          </aside>
        )}

      </div>

      {addOpen && (
        <AddSourceDialog onClose={() => setAddOpen(false)} onAdded={note => setNotes(prev => [note, ...prev])} />
      )}
    </div>
  )
}
