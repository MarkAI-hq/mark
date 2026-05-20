import { Mark, mergeAttributes } from '@tiptap/core';

export const DeletionMark = Mark.create({
  name: 'deletion',

  addAttributes() {
    return {
      suggestionId: {
        default: null,
        parseHTML: (el: HTMLElement) => el.getAttribute('data-suggestion-id'),
        renderHTML: (attrs: Record<string, unknown>) => ({
          'data-suggestion-id': attrs['suggestionId'],
        }),
      },
    };
  },

  parseHTML() {
    return [{ tag: 'span[data-suggestion-type="deletion"]' }];
  },

  renderHTML({ HTMLAttributes }: { HTMLAttributes: Record<string, unknown> }) {
    return [
      'span',
      mergeAttributes(HTMLAttributes, {
        'data-suggestion-type': 'deletion',
        class: 'mirror-deletion',
      }),
      0,
    ];
  },
});