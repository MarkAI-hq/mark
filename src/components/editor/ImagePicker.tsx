'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { ImageIcon, SkipForward, AlertTriangle, Sparkles, Check } from 'lucide-react';
import type { ImageCandidate, CurriculumImageType } from './types';

interface ImagePickerProps {
  candidates:          ImageCandidate[];
  /** needs_ai_generation from the parent RedesignSuggestion — set server-side */
  needsAiGeneration:   boolean;
  selectedCandidateId: string | null;
  skipped:             boolean;
  onSelect:            (id: string) => void;
  onSkip:              () => void;
}

const IMAGE_TYPE_LABELS: Record<CurriculumImageType, string> = {
  diagram:     'Diagram',
  map:         'Map',
  graph:       'Graph',
  figure:      'Figure',
  table:       'Table',
  photograph:  'Photograph',
  other:       'Visual',
};

function ConfidenceBar({ score }: { score: number }) {
  const pct = Math.round(score * 100);
  const colour =
    score >= 0.75 ? 'bg-emerald-500' :
    score >= 0.55 ? 'bg-amber-400'   :
                    'bg-red-400';
  return (
    <span className="flex items-center gap-1.5">
      <span className="w-16 h-1.5 rounded-full bg-muted overflow-hidden">
        <span className={cn('h-full rounded-full block', colour)} style={{ width: `${pct}%` }} />
      </span>
      <span className="text-[10px] text-muted-foreground font-mono tabular-nums">{pct}%</span>
    </span>
  );
}

function CandidateCard({
  candidate,
  selected,
  onSelect,
}: {
  candidate: ImageCandidate;
  selected:  boolean;
  onSelect:  () => void;
}) {
  return (
    <button
      onClick={onSelect}
      className={cn(
        'relative text-left w-full rounded-lg border-2 p-3 transition-all',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500',
        selected
          ? 'border-blue-500 bg-blue-50/60'
          : 'border-border bg-background hover:border-blue-300 hover:bg-muted/40',
      )}
    >
      {/* Selected checkmark */}
      {selected && (
        <span className="absolute top-2 right-2 w-4 h-4 rounded-full bg-blue-500 flex items-center justify-center">
          <Check className="w-2.5 h-2.5 text-white" />
        </span>
      )}

      {/* Thumbnail */}
      {candidate.image_url && (
        <span className="block w-full h-24 rounded-md overflow-hidden border border-border mb-2 bg-muted/30">
          <img
            src={`/api/v1/assessments/images/${candidate.id}/file`}
            alt={candidate.description}
            className="w-full h-full object-cover"
          />
        </span>
      )}

      {/* Header row */}
      <span className="flex items-center gap-2 mb-1.5">
        <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4 font-normal">
          {IMAGE_TYPE_LABELS[candidate.image_type]}
        </Badge>
        {candidate.topic && (
          <span className="text-[10px] text-muted-foreground truncate max-w-[140px]">
            {candidate.topic}
          </span>
        )}
      </span>

      {/* Description */}
      <p className="text-xs text-foreground leading-relaxed line-clamp-3 mb-2">
        {candidate.description}
      </p>

      {/* Tags */}
      {candidate.tags && candidate.tags.length > 0 && (
        <span className="flex gap-1 flex-wrap mb-2">
          {candidate.tags.slice(0, 4).map((tag) => (
            <span
              key={tag}
              className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground"
            >
              {tag}
            </span>
          ))}
        </span>
      )}

      <ConfidenceBar score={candidate.score} />
    </button>
  );
}

export function ImagePicker({
  candidates,
  needsAiGeneration,
  selectedCandidateId,
  skipped,
  onSelect,
  onSkip,
}: ImagePickerProps) {
  const [expanded, setExpanded] = useState(!selectedCandidateId && !skipped);

  // Skipped — compact flag
  if (skipped && !expanded) {
    return (
      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded border border-amber-300 bg-amber-50 text-amber-700 text-xs font-medium">
        <AlertTriangle className="w-3 h-3 shrink-0" />
        Image needed
        <button
          onClick={() => setExpanded(true)}
          className="underline hover:no-underline font-normal"
        >
          pick
        </button>
      </span>
    );
  }

  // Collapsed with a selection — show summary card with thumbnail
  if (selectedCandidateId && !expanded) {
    const selected = candidates.find((c) => c.id === selectedCandidateId);
    if (!selected) return null;
    return (
      <span className="inline-flex items-center gap-2 px-2.5 py-1.5 rounded-lg border border-blue-200 bg-blue-50/50 text-xs max-w-sm">
        {selected.image_url ? (
          <img
            src={`/api/v1/assessments/images/${selected.id}/file`}
            alt={selected.description}
            className="w-8 h-8 rounded object-cover border border-border shrink-0"
          />
        ) : (
          <ImageIcon className="w-3.5 h-3.5 text-blue-500 shrink-0" />
        )}
        <span className="truncate text-foreground">{selected.description}</span>
        <button
          onClick={() => setExpanded(true)}
          className="shrink-0 text-muted-foreground underline hover:no-underline"
        >
          change
        </button>
      </span>
    );
  }

  // Expanded picker
  return (
    <span className="flex flex-col gap-3 p-3 border border-blue-200 rounded-xl bg-blue-50/40 my-1.5 not-prose w-full max-w-lg">
      {/* Header */}
      <span className="flex items-center gap-2">
        <ImageIcon className="w-3.5 h-3.5 text-blue-600 shrink-0" />
        <span className="text-xs font-medium text-blue-700">
          Select an image for this item
        </span>
        {needsAiGeneration && (
          <span className="ml-auto flex items-center gap-1 text-[10px] text-amber-700">
            <Sparkles className="w-3 h-3" />
            No confident match — AI generation may be needed
          </span>
        )}
      </span>

      {/* Candidate cards */}
      <span className="flex flex-col gap-2">
        {candidates.map((candidate) => (
          <CandidateCard
            key={candidate.id}
            candidate={candidate}
            selected={selectedCandidateId === candidate.id}
            onSelect={() => {
              onSelect(candidate.id);
              setExpanded(false);
            }}
          />
        ))}
      </span>

      {/* Footer */}
      <Button
        variant="ghost"
        size="sm"
        onClick={() => {
          onSkip();
          setExpanded(false);
        }}
        className="self-start text-xs h-7 gap-1.5 text-muted-foreground"
      >
        <SkipForward className="w-3 h-3" />
        Flag for later
      </Button>
    </span>
  );
}