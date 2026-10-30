import { mergeAttributes, Node } from '@tiptap/core';

import { dataFileIdKey, dataFileNameKey } from './constant';

export const Video = Node.create({
  addAttributes() {
    return {
      [dataFileIdKey]: { default: null },
      [dataFileNameKey]: { default: null },
      src: { default: null },
    };
  },
  atom: true,
  draggable: true,
  group: 'block',
  name: 'video',
  parseHTML() {
    return [{ tag: 'video[src]' }];
  },
  renderHTML({ HTMLAttributes }) {
    return ['video', mergeAttributes(HTMLAttributes, { controls: '', preload: 'metadata' })];
  },
});
