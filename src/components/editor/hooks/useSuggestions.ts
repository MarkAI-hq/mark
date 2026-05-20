import { useCallback, useMemo, useState } from 'react';
import type { Editor } from '@tiptap/react';
import type { Node as ProseMirrorNode } from '@tiptap/pm/model';
import type { SuggestionRecord, SuggestionType } from '../types';

/**
 * Finds all text ranges in the doc carrying a given mark+suggestionId.
 * Merges adjacent ranges (a single logical suggestion may span multiple
 * ProseMirror text nodes due to formatting boundaries).
 */
function findMarkRanges(
  doc: ProseMirrorNode,
  markName: string,
  suggestionId: string
): { from: number; to: number }[] {
  const ranges: { from: number; to: number }[] = [];

  doc.descendants((node, pos) => {
    if (!node.isText) return;
    const hasMark = node.marks.some(
      (m) => m.type.name === markName && m.attrs.suggestionId === suggestionId
    );
    if (hasMark) ranges.push({ from: pos, to: pos + node.nodeSize });
  });

  if (ranges.length === 0) return [];
  ranges.sort((a, b) => a.from - b.from);

  const merged = [{ ...ranges[0] }];
  for (let i = 1; i < ranges.length; i++) {
    const last = merged[merged.length - 1];
    if (ranges[i].from <= last.to) {
      last.to = Math.max(last.to, ranges[i].to);
    } else {
      merged.push({ ...ranges[i] });
    }
  }
  return merged;
}

export function useSuggestions(
  editor: Editor | null,
  initialSuggestions: SuggestionRecord[]
) {
  const [suggestions, setSuggestions] = useState<SuggestionRecord[]>(initialSuggestions);

  const pending = useMemo(
    () => suggestions.filter((s) => s.status === 'pending'),
    [suggestions]
  );

  /**
   * Resolve a single suggestion. Dispatches a ProseMirror transaction:
   *
   *   insertion + accept → remove mark, keep text
   *   insertion + reject → delete text
   *   deletion  + accept → delete text
   *   deletion  + reject → remove mark, keep text
   */
  const resolve = useCallback(
    (id: string, type: SuggestionType, action: 'accept' | 'reject') => {
      if (!editor) return;
      const { state } = editor;
      const tr = state.tr;
      const markName = type;
      const ranges = findMarkRanges(state.doc, markName, id);

      const shouldDeleteText =
        (type === 'insertion' && action === 'reject') ||
        (type === 'deletion' && action === 'accept');

      if (shouldDeleteText) {
        // Delete in reverse order so earlier deletions don't shift later positions
        [...ranges].reverse().forEach(({ from, to }) => {
          tr.delete(tr.mapping.map(from), tr.mapping.map(to));
        });
      } else {
        // Remove mark only — no position shift
        ranges.forEach(({ from, to }) => {
          tr.removeMark(from, to, state.schema.marks[markName]);
        });
      }

      editor.view.dispatch(tr);
      setSuggestions((prev) =>
        prev.map((s) =>
          s.id === id
            ? { ...s, status: action === 'accept' ? 'accepted' : 'rejected' }
            : s
        )
      );
    },
    [editor]
  );

  /**
   * Resolve all pending suggestions in a SINGLE transaction.
   *
   * Two-pass approach to avoid position drift:
   *   Pass 1 — mark removals only (no doc length change)
   *   Pass 2 — text deletions, sorted reverse by position, mapped through tr
   */
  const resolveAll = useCallback(
    (action: 'accept' | 'reject') => {
      if (!editor) return;
      const { state } = editor;
      const tr = state.tr;
      const toResolve = suggestions.filter((s) => s.status === 'pending');

      // Pass 1: mark removals
      toResolve.forEach(({ id, type }) => {
        const isMarkRemoval =
          (type === 'insertion' && action === 'accept') ||
          (type === 'deletion' && action === 'reject');
        if (!isMarkRemoval) return;

        findMarkRanges(state.doc, type, id).forEach(({ from, to }) => {
          tr.removeMark(from, to, state.schema.marks[type]);
        });
      });

      // Pass 2: text deletions in reverse position order
      const deletionRanges: { from: number; to: number }[] = [];
      toResolve.forEach(({ id, type }) => {
        const isTextDeletion =
          (type === 'insertion' && action === 'reject') ||
          (type === 'deletion' && action === 'accept');
        if (!isTextDeletion) return;

        findMarkRanges(state.doc, type, id).forEach((r) => deletionRanges.push(r));
      });

      deletionRanges
        .sort((a, b) => b.from - a.from)
        .forEach(({ from, to }) => {
          tr.delete(tr.mapping.map(from), tr.mapping.map(to));
        });

      editor.view.dispatch(tr);
      setSuggestions((prev) =>
        prev.map((s) =>
          s.status === 'pending'
            ? { ...s, status: action === 'accept' ? 'accepted' : 'rejected' }
            : s
        )
      );
    },
    [editor, suggestions]
  );

  return {
    suggestions,
    pending,
    acceptSuggestion: (id: string, type: SuggestionType) => resolve(id, type, 'accept'),
    rejectSuggestion: (id: string, type: SuggestionType) => resolve(id, type, 'reject'),
    acceptAll: () => resolveAll('accept'),
    rejectAll: () => resolveAll('reject'),
  };
}