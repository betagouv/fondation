import { Editor } from '@tiptap/react';

export const markPriorityFactory = (editor: Editor, mark: string, options?: Record<string, unknown>) =>
  editor.isFocused && editor.isActive(mark, options) ? 'primary' : 'tertiary no outline';
