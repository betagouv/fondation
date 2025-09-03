import { Editor } from '@tiptap/react';

export const markPriorityFactory = (editor: Editor, mark: string, options?: { level: number }) =>
  editor.isFocused && editor.isActive(mark, options) ? 'primary' : 'tertiary';
