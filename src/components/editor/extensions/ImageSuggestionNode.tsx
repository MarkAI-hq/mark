import { Node, mergeAttributes } from '@tiptap/core';
import { ReactNodeViewRenderer, NodeViewWrapper } from '@tiptap/react';
import type { NodeViewProps } from '@tiptap/react';
import { ImagePicker } from '../ImagePicker';
import type { ImageCandidate } from '../types';

/**
 * Inline atom node rendered as a React component.
 * Teachers pick from 3 image candidates or skip to flag for later.
 * Selected candidateId is stored in node attrs so it survives re-renders
 * and is included in the final export.
 */
function ImageSuggestionView({ node, updateAttributes }: NodeViewProps) {
  const candidates: ImageCandidate[]  = node.attrs.candidates ?? [];
  const selectedCandidateId: string | null = node.attrs.selectedCandidateId;
  const skipped: boolean              = node.attrs.skipped ?? false;
  const needsAiGeneration: boolean    = node.attrs.needsAiGeneration ?? false;

  return (
    <NodeViewWrapper as="span" contentEditable={false} className="inline-block align-middle mx-1">
      <ImagePicker
        candidates={candidates}
        needsAiGeneration={needsAiGeneration}
        selectedCandidateId={selectedCandidateId}
        skipped={skipped}
        onSelect={(id) => updateAttributes({ selectedCandidateId: id, skipped: false })}
        onSkip={() => updateAttributes({ selectedCandidateId: null, skipped: true })}
      />
    </NodeViewWrapper>
  );
}

export const ImageSuggestionNode = Node.create({
  name: 'imageSuggestion',
  group: 'inline',
  inline: true,
  atom: true,
  selectable: true,
  draggable: false,

  addAttributes() {
    return {
      suggestionId:        { default: null },
      candidates:          { default: [] },
      needsAiGeneration:   { default: false },
      selectedCandidateId: { default: null },
      skipped:             { default: false },
    };
  },

  parseHTML() {
    return [{ tag: 'span[data-node-type="image-suggestion"]' }];
  },

  renderHTML({ HTMLAttributes }: { HTMLAttributes: Record<string, unknown> }) {
    return [
      'span',
      mergeAttributes(HTMLAttributes, { 'data-node-type': 'image-suggestion' }),
    ];
  },

  addNodeView() {
    return ReactNodeViewRenderer(ImageSuggestionView);
  },
});