'use client'

import { ArrowLeft, CheckCheck, SkipForward, Image as ImageIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import type { RedesignVariation, ParsedQuestion } from '@/lib/actions/audit'
import type { DiffInsertion, ImageCandidate } from '@/components/editor/types'

interface WalkthroughStep {
  dimension:  string
  insertions: DiffInsertion[]
  images:     ImageCandidate[]
}

interface ReviewWalkthroughProps {
  variation:       RedesignVariation
  parsedQuestions: ParsedQuestion[]
  currentIdx:      number
  steps:           WalkthroughStep[]
  acceptedDims:    Set<string>
  selectedImages:  Map<string, string>
  onAccept:        (dimension: string) => void
  onSkip:          () => void
  onBack:          () => void
  onToggleImage:   (insertionId: string, imageUrl: string) => void
}

// ── Helpers ────────────────────────────────────────────────────────────────

const DIMENSION_LABELS: Record<string, string> = {
  blooms:        "Bloom's Taxonomy",
  kusa:          'KUSA Distribution',
  topics:        'Syllabus Coverage',
  command_words: 'Command Words',
  marks:         'Mark Allocation',
}

const IMAGE_CONFIDENCE_THRESHOLD = 0.4

function buildSteps(diff: { insertions: DiffInsertion[]; imageSuggestions?: any[] }): WalkthroughStep[] {
  const byDimension = new Map<string, DiffInsertion[]>()
  for (const ins of diff.insertions) {
    const dim = ins.dimension ?? 'general'
    if (!byDimension.has(dim)) byDimension.set(dim, [])
    byDimension.get(dim)!.push(ins)
  }

  const imageSuggestions = diff.imageSuggestions ?? []

  return Array.from(byDimension.entries()).map(([dimension, insertions]) => {
    const relevantPositions = new Set(insertions.map(i => i.from))
    const images = imageSuggestions
      .filter(img => relevantPositions.has(img.position))
      .flatMap((img: { candidates: ImageCandidate[] }) => img.candidates.filter(c => c.score >= IMAGE_CONFIDENCE_THRESHOLD))

    return { dimension, insertions, images }
  })
}

export { buildSteps }
export type { WalkthroughStep }

// ── Question cards ─────────────────────────────────────────────────────────

function QuestionCard({
  label,
  questionNumber,
  text,
  marks,
  bloomsLevel,
  commandWord,
  variant,
}: {
  label:          string
  questionNumber?: string | null
  text:           string
  marks:          number
  bloomsLevel?:   string | null
  commandWord?:   string | null
  variant:        'current' | 'proposed'
}) {
  return (
    <div className={cn(
      'rounded-xl border p-4 flex flex-col gap-2',
      variant === 'current'
        ? 'border-muted bg-muted/20'
        : 'border-[#e8d5a3] bg-[#f5edda]/40',
    )}>
      <div className="flex items-center justify-between">
        <span className={cn(
          'text-[10px] font-black uppercase tracking-wider',
          variant === 'current' ? 'text-muted-foreground' : 'text-[#7a6230]',
        )}>
          {label}{questionNumber ? ` · Q${questionNumber}` : ''}
        </span>
        <span className={cn(
          'text-[10px] font-bold',
          variant === 'proposed' ? 'text-[#c9a84c]' : 'text-muted-foreground',
        )}>
          {marks} mark{marks !== 1 ? 's' : ''}
        </span>
      </div>
      <p className="text-sm leading-relaxed text-foreground">&ldquo;{text}&rdquo;</p>
      {(bloomsLevel || commandWord) && (
        <div className="flex flex-wrap gap-1.5 mt-1">
          {commandWord && (
            <Badge className={cn(
              'text-[9px] border-none px-1.5 py-0 h-4',
              variant === 'proposed' ? 'bg-[#c9a84c]/20 text-[#7a6230]' : 'bg-muted text-muted-foreground',
            )}>
              {commandWord}
            </Badge>
          )}
          {bloomsLevel && (
            <Badge className={cn(
              'text-[9px] border-none px-1.5 py-0 h-4',
              variant === 'proposed' ? 'bg-emerald-100 text-emerald-700' : 'bg-muted text-muted-foreground',
            )}>
              {bloomsLevel}
            </Badge>
          )}
        </div>
      )}
    </div>
  )
}

// ── Main component ─────────────────────────────────────────────────────────

export function ReviewWalkthrough({
  variation,
  parsedQuestions,
  currentIdx,
  steps,
  acceptedDims,
  selectedImages,
  onAccept,
  onSkip,
  onBack,
  onToggleImage,
}: ReviewWalkthroughProps) {
  const step       = steps[currentIdx]
  const totalSteps = steps.length
  const progress   = Math.round(((currentIdx) / totalSteps) * 100)

  if (!step) return null

  const dimLabel = DIMENSION_LABELS[step.dimension] ?? step.dimension.replace(/_/g, ' ')

  // Build question cards from insertions
  const insertion = step.insertions[0]
  const sug = insertion?.source

  const originalQuestion = sug?.question_number
    ? parsedQuestions.find(q => String(q.question_number) === String(sug.question_number).replace(/^q(uestion)?\s*/i, '').trim())
    : null

  const hasMore = step.insertions.length > 1

  // Images for this step (confidence ≥ threshold)
  const stepImages = step.images

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-6 pt-4 pb-3 border-b shrink-0"
        style={{ background: 'linear-gradient(to bottom, #f5edda80, transparent)' }}>
        <div className="flex items-center justify-between mb-3">
          <button
            onClick={onBack}
            className="text-[10px] font-medium text-muted-foreground hover:text-foreground flex items-center gap-1"
          >
            <ArrowLeft className="h-3 w-3" />Back
          </button>
          <span className="text-[10px] font-semibold text-muted-foreground">
            Issue {currentIdx + 1} of {totalSteps}
          </span>
        </div>

        {/* Progress bar */}
        <div className="relative h-1.5 w-full rounded-full overflow-hidden mb-2" style={{ background: '#e8d5a3' }}>
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{ width: `${progress}%`, background: '#c9a84c' }}
          />
        </div>

        <div className="flex items-center justify-between">
          <h3 className="text-sm font-black uppercase tracking-wide" style={{ color: '#7a6230' }}>
            {dimLabel}
          </h3>
          <span className="text-[10px] text-muted-foreground">
            Projected: {variation.projected_score}/100
          </span>
        </div>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
        {/* Dimension description from the source */}
        {sug?.syllabus_topic && (
          <p className="text-xs text-muted-foreground leading-relaxed border-l-2 border-[#e8d5a3] pl-3">
            This question targets the <strong>{sug.syllabus_topic}</strong> topic and addresses the {sug.assessment_objective_id} assessment objective.
          </p>
        )}

        {/* AO + Bloom info */}
        {sug && (
          <div className="flex flex-wrap gap-2 text-[10px] text-muted-foreground">
            {sug.assessment_objective_id && (
              <span className="px-2 py-0.5 rounded bg-[#f5edda] text-[#7a6230] font-semibold">
                {sug.assessment_objective_id}
              </span>
            )}
            {sug.syllabus_topic && (
              <span className="px-2 py-0.5 rounded bg-muted text-foreground">
                {sug.syllabus_topic}
              </span>
            )}
          </div>
        )}

        {/* Before / After question cards */}
        {sug && (
          <div className="grid gap-3">
            {originalQuestion && (
              <QuestionCard
                label="Current"
                questionNumber={sug.question_number}
                text={originalQuestion.question_text}
                marks={originalQuestion.marks}
                bloomsLevel={originalQuestion.blooms_level}
                commandWord={originalQuestion.command_word}
                variant="current"
              />
            )}
            <QuestionCard
              label={sug.action_type === 'add_question' ? 'New question' : 'Proposed'}
              questionNumber={sug.question_number}
              text={sug.description}
              marks={sug.marks}
              bloomsLevel={sug.bloom_level}
              commandWord={sug.command_word}
              variant="proposed"
            />
          </div>
        )}

        {/* Additional changes in this dimension */}
        {hasMore && (
          <p className="text-[10px] text-muted-foreground pl-2">
            ▸ {step.insertions.length - 1} more change{step.insertions.length - 1 !== 1 ? 's' : ''} for this dimension
          </p>
        )}

        {/* Image thumbnails */}
        {stepImages.length > 0 && (
          <div className="space-y-2">
            <p className="text-[10px] font-black uppercase tracking-wider text-muted-foreground flex items-center gap-1">
              <ImageIcon className="h-3 w-3" />Image — optional
            </p>
            <div className="flex flex-wrap gap-2">
              {stepImages.map(img => {
                const isSelected = selectedImages.has(insertion.id) && selectedImages.get(insertion.id) === img.image_url
                return (
                  <button
                    key={img.id}
                    onClick={() => img.image_url && onToggleImage(insertion.id, img.image_url)}
                    className={cn(
                      'relative w-20 h-20 rounded-lg overflow-hidden border-2 transition-all',
                      isSelected
                        ? 'border-[#c9a84c] ring-2 ring-[#c9a84c]/30'
                        : 'border-transparent hover:border-[#e8d5a3]',
                    )}
                  >
                    {img.image_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={`/api/v1/curriculum-images/${img.id}/file`}
                        alt={img.description}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-muted flex items-center justify-center">
                        <ImageIcon className="h-5 w-5 text-muted-foreground" />
                      </div>
                    )}
                    <div className="absolute bottom-0 left-0 right-0 bg-black/50 px-1 py-0.5">
                      <span className="text-[8px] text-white font-bold">{(img.score * 100).toFixed(0)}%</span>
                    </div>
                    {isSelected && (
                      <div className="absolute top-1 right-1 w-4 h-4 rounded-full bg-[#c9a84c] flex items-center justify-center">
                        <CheckCheck className="h-2.5 w-2.5 text-white" />
                      </div>
                    )}
                  </button>
                )
              })}
            </div>
            <p className="text-[9px] text-muted-foreground">Tap to include · {selectedImages.has(insertion.id) ? '1 selected' : 'None selected'}</p>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="px-6 py-4 border-t shrink-0 flex items-center justify-between" style={{ background: '#f5edda18' }}>
        <Button
          variant="ghost"
          size="sm"
          className="gap-1.5 text-muted-foreground"
          onClick={onSkip}
        >
          <SkipForward className="h-3.5 w-3.5" />Skip →
        </Button>
        <Button
          size="sm"
          className="gap-2 border-0 text-white"
          style={{ background: '#c9a84c' }}
          onClick={() => onAccept(step.dimension)}
        >
          <CheckCheck className="h-3.5 w-3.5" />Fix {dimLabel} →
        </Button>
      </div>
    </div>
  )
}
