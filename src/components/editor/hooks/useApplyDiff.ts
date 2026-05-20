import { useEffect } from 'react';
import type { Editor } from '@tiptap/react';
import type { AssessmentDiff, ImageCandidate } from '../types';

type PendingOp =
  | { kind: 'insertion';       id: string; position: number; content: string }
  | { kind: 'imageSuggestion'; id: string; position: number; candidates: ImageCandidate[]; needsAiGeneration: boolean };

/**
 * Applies a structured diff to the TipTap editor as tracked-change marks.
 *
 * Called once when the editor becomes ready. Uses a single ProseMirror
 * transaction so the entire diff application is atomic and excluded from undo history.
 *
 * Ordering strategy:
 *   Pass 1 — deletion marks: addMark() has no effect on doc length, so no mapping needed
 *   Pass 2 — insertions + image suggestion nodes: sorted reverse by position so
 *             each insert doesn't invalidate positions for subsequent ones;
 *             tr.mapping.map() used for safety after each step
 */
export function useApplyDiff(editor: Editor | null, diff: AssessmentDiff | null) {
  useEffect(() => {
    if (!editor || !diff) return;

    const { state } = editor;
    const tr = state.tr;

    // Pass 1: deletion marks (no position change)
    diff.deletions.forEach(({ id, from, to }) => {
      const mark = state.schema.marks.deletion.create({ suggestionId: id });
      tr.addMark(from, to, mark);
    });

    // Pass 2: insertions + image nodes, reverse position order
    const ops: PendingOp[] = [
      ...diff.insertions.map((i) => ({
        kind: 'insertion' as const,
        id: i.id,
        position: i.from,
        content: i.content,
      })),
      ...diff.imageSuggestions.map((s) => ({
        kind:              'imageSuggestion' as const,
        id:                s.id,
        position:          s.position,
        candidates:        s.candidates,
        needsAiGeneration: s.needs_ai_generation,
      })),
    ];

    ops.sort((a, b) => b.position - a.position);

    ops.forEach((op) => {
      const pos = tr.mapping.map(op.position);

      if (op.kind === 'insertion') {
        const mark = state.schema.marks.insertion.create({ suggestionId: op.id });
        const textNode = state.schema.text(op.content, [mark]);
        tr.insert(pos, textNode);
      } else {
        const node = state.schema.nodes.imageSuggestion.create({
          suggestionId:      op.id,
          candidates:        op.candidates,
          needsAiGeneration: op.needsAiGeneration,
        });
        tr.insert(pos, node);
      }
    });

    // Exclude from undo history — this is a programmatic initialisation step
    tr.setMeta('addToHistory', false);
    editor.view.dispatch(tr);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editor]); // intentionally runs only when editor becomes ready
}