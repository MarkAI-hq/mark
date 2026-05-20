import { Mark, mergeAttributes } from '@tiptap/core';

export const InsertionMark = Mark.create({
  name: 'insertion',

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
    return [{ tag: 'span[data-suggestion-type="insertion"]' }];
  },

  renderHTML({ HTMLAttributes }: { HTMLAttributes: Record<string, unknown> }) {
    return [
      'span',
      mergeAttributes(HTMLAttributes, {
        'data-suggestion-type': 'insertion',
        class: 'mirror-insertion',
      }),
      0,
    ];
  },
});