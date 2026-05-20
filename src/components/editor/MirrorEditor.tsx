'use client';

import { forwardRef, useImperativeHandle, useMemo, useState } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { InsertionMark }       from './extensions/InsertionMark';
import { DeletionMark }        from './extensions/DeletionMark';
import { ImageSuggestionNode } from './extensions/ImageSuggestionNode';
import { useSuggestions }      from './hooks/useSuggestions';
import { useApplyDiff }        from './hooks/useApplyDiff';
import type { AssessmentDiff, SuggestionRecord, DiffInsertion, ImageCandidate } from './types';
import { CheckCheck, X, BookOpen, Tag, Brain, AlignLeft, Image as ImageIcon, Sparkles } from 'lucide-react';
import { Badge }  from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn }     from '@/lib/utils';
import './editor.css';

// ── Public handle exposed via ref ─────────────────────────────────────────────

export interface MirrorEditorHandle {
  getHTML:         () => string;
  getAcceptedImages: () => Array<{ image_url: string | null; position: number }>;
}

interface MirrorEditorProps {
  diff:        AssessmentDiff;
  onConfirm?:  (html: string, acceptedImages: Array<{ image_url: string | null; position: number }>) => void;
  className?:  string;
  /** Optional renderer for per-suggestion metadata. Defaults to GroundingTrace. */
  renderMeta?: (insertion: DiffInsertion) => React.ReactNode;
  /** Optional label overrides for action_type badges */
  actionLabels?: Record<string, string>;
  /** Label for the confirm button */
  confirmLabel?: string;
}

// ── Grounding trace card (default meta renderer) ──────────────────────────────

export function GroundingTrace({ source }: { source: DiffInsertion['source'] }) {
  return (
    <div className="mt-2 space-y-1.5 text-[11px] border-t border-border/50 pt-2">
      <div className="flex items-center gap-1.5 text-muted-foreground">
        <BookOpen className="w-3 h-3 shrink-0" style={{ color: '#c9a84c' }} />
        <span className="font-medium" style={{ color: '#7a6230' }}>{source.assessment_objective_id}</span>
        <span className="truncate">{source.syllabus_topic}</span>
      </div>
      <div className="flex items-center gap-1.5 text-muted-foreground">
        <Brain className="w-3 h-3 shrink-0" style={{ color: '#c9a84c' }} />
        <span>Bloom: <strong>{source.bloom_level}</strong></span>
        <span className="mx-1">·</span>
        <Tag className="w-3 h-3 shrink-0" />
        <span>CW: <strong>{source.command_word}</strong></span>
      </div>
    </div>
  );
}

// ── Suggestion card ───────────────────────────────────────────────────────────

function SuggestionCard({
  suggestion,
  insertion,
  isActive,
  onClick,
  onAccept,
  onReject,
  renderMeta,
  actionLabels,
}: {
  suggestion:    SuggestionRecord;
  insertion?:    DiffInsertion;
  isActive:      boolean;
  onClick:       () => void;
  onAccept:      () => void;
  onReject:      () => void;
  renderMeta?:   (insertion: DiffInsertion) => React.ReactNode;
  actionLabels?: Record<string, string>;
}) {
  const isPending  = suggestion.status === 'pending';
  const isAccepted = suggestion.status === 'accepted';

  const defaultActionLabels: Record<string, string> = {
    add_question:    'Add question',
    modify_question: 'Modify question',
    adjust_marks:    'Adjust marks',
    ...actionLabels,
  };

  return (
    <div
      onClick={onClick}
      className={cn(
        'rounded-lg border p-3 cursor-pointer transition-all duration-150 select-none',
        isActive   && isPending  && 'border-[#c9a84c] bg-[#f5edda]/40 shadow-sm',
        !isActive  && isPending  && 'border-border hover:border-[#e8d5a3] hover:bg-[#f5edda]/20',
        isAccepted && 'border-emerald-200 bg-emerald-50/40 dark:bg-emerald-900/10',
        suggestion.status === 'rejected' && 'border-border bg-muted/30 opacity-50',
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          {insertion && (
            <>
              <div className="flex items-center gap-1.5 mb-1">
                <Badge className="text-[9px] uppercase tracking-wide border-none bg-[#f5edda] text-[#7a6230]">
                  {defaultActionLabels[insertion.source.action_type] ?? insertion.source.action_type}
                </Badge>
                <span className="font-medium text-xs truncate">{insertion.source.title}</span>
              </div>
              <p className="text-[11px] text-muted-foreground leading-relaxed line-clamp-2">
                {insertion.source.description}
              </p>
              {renderMeta
                ? renderMeta(insertion)
                : <GroundingTrace source={insertion.source} />
              }
            </>
          )}
          {!insertion && (
            <p className="text-xs text-muted-foreground">Deletion</p>
          )}
        </div>

        {isPending && (
          <div className="flex flex-col gap-1 shrink-0">
            <button
              onClick={e => { e.stopPropagation(); onAccept(); }}
              className="w-6 h-6 rounded flex items-center justify-center bg-emerald-100 hover:bg-emerald-200 text-emerald-700 transition-colors"
              title="Accept"
            >
              <CheckCheck className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={e => { e.stopPropagation(); onReject(); }}
              className="w-6 h-6 rounded flex items-center justify-center bg-red-100 hover:bg-red-200 text-red-600 transition-colors"
              title="Reject"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {isAccepted && (
          <CheckCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
        )}
      </div>
    </div>
  );
}

// ── Image suggestion panel ────────────────────────────────────────────────────

function ImagePanel({ diff }: { diff: AssessmentDiff }) {
  const [accepted, setAccepted] = useState<Set<string>>(new Set());

  if (!diff.imageSuggestions.length) return null;

  return (
    <div className="border-t border-border mt-3 pt-3">
      <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-2 flex items-center gap-1.5">
        <ImageIcon className="w-3 h-3" />Visual suggestions
      </p>
      <div className="space-y-2">
        {diff.imageSuggestions.map(img => (
          <div key={img.id} className="rounded-md border border-border p-2">
            {img.needs_ai_generation && (
              <div className="flex items-center gap-1.5 text-[10px] text-amber-600 mb-1.5">
                <Sparkles className="w-3 h-3" />No library match — AI generation suggested
              </div>
            )}
            <div className="space-y-1.5">
              {img.candidates.map(c => (
                <div
                  key={c.id}
                  className={cn(
                    'flex items-start gap-2 rounded p-1.5 cursor-pointer border transition-colors',
                    accepted.has(c.id)
                      ? 'border-emerald-300 bg-emerald-50/50'
                      : 'border-transparent hover:border-border hover:bg-muted/30',
                  )}
                  onClick={() => setAccepted(prev => {
                    const next = new Set(prev);
                    next.has(c.id) ? next.delete(c.id) : next.add(c.id);
                    return next;
                  })}
                >
                  {c.image_url ? (
                    <img
                      src={`/api/v1/assessments/images/${c.id}/file`}
                      alt={c.description}
                      className="w-12 h-10 object-cover rounded border border-border shrink-0"
                    />
                  ) : (
                    <div className="w-12 h-10 rounded border border-dashed border-border bg-muted/30 flex items-center justify-center shrink-0">
                      <ImageIcon className="w-4 h-4 text-muted-foreground" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-[10px] leading-relaxed text-muted-foreground line-clamp-2">{c.description}</p>
                    <div className="flex items-center gap-1 mt-0.5">
                      <Badge className="text-[9px] border-none bg-muted text-muted-foreground">{c.image_type}</Badge>
                      <span className="text-[9px] text-muted-foreground">{(c.score * 100).toFixed(0)}% match</span>
                    </div>
                  </div>
                  {accepted.has(c.id) && <CheckCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Main editor ───────────────────────────────────────────────────────────────

export const MirrorEditor = forwardRef<MirrorEditorHandle, MirrorEditorProps>(
  function MirrorEditor({
    diff,
    onConfirm,
    className,
    renderMeta,
    actionLabels,
    confirmLabel = 'Confirm & export',
  }, ref) {
    const [activeId, setActiveId] = useState<string | null>(null);

    const extensions = useMemo(
      () => [StarterKit, InsertionMark, DeletionMark, ImageSuggestionNode],
      [],
    );

    const initialSuggestions: SuggestionRecord[] = useMemo(() => [
      ...diff.insertions.map(i => ({ id: i.id, type: 'insertion' as const, status: 'pending' as const })),
      ...diff.deletions.map(d => ({ id: d.id, type: 'deletion' as const, status: 'pending' as const })),
    ], []);

    const editor = useEditor({
      extensions,
      content: diff.documentContent,
      editorProps: {
        attributes: {
          class: 'prose prose-sm max-w-none focus:outline-none px-5 py-5 min-h-[400px] leading-relaxed',
        },
      },
    });

    useApplyDiff(editor, diff);

    const { suggestions, acceptSuggestion, rejectSuggestion, acceptAll, rejectAll } =
      useSuggestions(editor, initialSuggestions);

    const pending  = suggestions.filter(s => s.status === 'pending');
    const accepted = suggestions.filter(s => s.status === 'accepted');
    const rejected = suggestions.filter(s => s.status === 'rejected');

    const insertionById = useMemo(() => {
      const map = new Map<string, DiffInsertion>();
      diff.insertions.forEach(i => map.set(i.id, i));
      return map;
    }, [diff.insertions]);

    // ── Collect accepted images from editor nodes ──────────────────────────
    const collectAcceptedImages = (): Array<{ image_url: string | null; position: number }> => {
      if (!editor) return [];
      const acceptedImages: Array<{ image_url: string | null; position: number }> = [];
      editor.state.doc.descendants((node, pos) => {
        if (node.type.name !== 'imageSuggestion') return;
        const { selectedCandidateId, candidates } = node.attrs;
        if (!selectedCandidateId) return;
        const selected = (candidates as Array<{ id: string; image_url: string | null }>)
          .find(c => c.id === selectedCandidateId);
        if (selected?.image_url) {
          acceptedImages.push({ image_url: selected.image_url, position: pos });
        }
      });
      return acceptedImages;
    };

    // ── Expose handle to parent via ref ───────────────────────────────────
    useImperativeHandle(ref, () => ({
      getHTML: () => editor?.getHTML() ?? '',
      getAcceptedImages: collectAcceptedImages,
    }));

    const handleConfirm = () => {
      if (!editor || !onConfirm) return;
      onConfirm(editor.getHTML(), collectAcceptedImages());
    };

    return (
      <div className={cn('flex gap-0 h-full', className)}>

        {/* ── Left: document editor ── */}
        <div className="flex-1 min-w-0 flex flex-col">
          <div className="flex items-center justify-between px-3 py-2 border-b border-border bg-muted/20 shrink-0">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <AlignLeft className="w-3.5 h-3.5" />
              <span>Document</span>
            </div>
            <div className="flex items-center gap-1.5 text-xs">
              {pending.length > 0 && (
                <Badge variant="secondary" className="font-mono tabular-nums text-[10px]">
                  {pending.length} pending
                </Badge>
              )}
              {accepted.length > 0 && (
                <span className="text-emerald-600 text-[10px]">{accepted.length} accepted</span>
              )}
              {rejected.length > 0 && (
                <span className="text-destructive text-[10px]">{rejected.length} rejected</span>
              )}
            </div>
          </div>

          <div className="flex-1 overflow-y-auto border-r border-border">
            <EditorContent editor={editor} />
          </div>

          {onConfirm && (
            <div className="px-4 py-3 border-t border-border bg-muted/10 shrink-0 flex items-center justify-between">
              <p className="text-xs text-muted-foreground">
                {pending.length === 0
                  ? 'All changes resolved — ready to export.'
                  : `${pending.length} suggestion${pending.length !== 1 ? 's' : ''} still pending.`}
              </p>
              <Button
                size="sm"
                onClick={handleConfirm}
                className="gap-2 border-0 text-white"
                style={{ background: '#c9a84c' }}
              >
                <CheckCheck className="w-4 h-4" />
                {confirmLabel}
              </Button>
            </div>
          )}
        </div>

        {/* ── Right: suggestion panel ── */}
        <div className="w-72 shrink-0 flex flex-col border-l border-border">
          <div className="flex items-center justify-between px-3 py-2 border-b border-border bg-muted/20 shrink-0">
            <span className="text-xs font-medium text-muted-foreground">Suggestions</span>
            {pending.length > 0 && (
              <div className="flex gap-1">
                <button
                  onClick={rejectAll}
                  className="text-[10px] px-2 py-0.5 rounded border border-destructive/30 text-destructive hover:bg-destructive/10 transition-colors"
                >
                  Reject all
                </button>
                <button
                  onClick={acceptAll}
                  className="text-[10px] px-2 py-0.5 rounded border border-emerald-300 text-emerald-700 hover:bg-emerald-50 transition-colors"
                >
                  Accept all
                </button>
              </div>
            )}
          </div>

          <div className="flex-1 overflow-y-auto px-3 py-3 space-y-2">
            {suggestions.length === 0 && (
              <div className="flex flex-col items-center justify-center h-32 text-center gap-2">
                <CheckCheck className="w-6 h-6 text-emerald-500" />
                <p className="text-xs text-muted-foreground">No suggestions generated.</p>
              </div>
            )}

            {suggestions.map(s => (
              <SuggestionCard
                key={s.id}
                suggestion={s}
                insertion={insertionById.get(s.id)}
                isActive={activeId === s.id}
                onClick={() => setActiveId(prev => prev === s.id ? null : s.id)}
                onAccept={() => acceptSuggestion(s.id, s.type)}
                onReject={() => rejectSuggestion(s.id, s.type)}
                renderMeta={renderMeta}
                actionLabels={actionLabels}
              />
            ))}

            <ImagePanel diff={diff} />
          </div>
        </div>
      </div>
    );
  }
);