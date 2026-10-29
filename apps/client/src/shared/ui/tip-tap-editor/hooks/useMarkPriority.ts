import { useCurrentEditor, useEditorState } from '@tiptap/react';

import { markPriorityFactory } from '../markPriorityFactory';

export const useMarkPriority = (mark?: string, options?: Record<string, unknown>) => {
  const { editor } = useCurrentEditor();
  const priority = useEditorState({
    editor,
    selector: (ctx) => {
      if (!mark) return 'tertiary no outline';

      return ctx.editor ? markPriorityFactory(ctx.editor, mark, options) : 'tertiary no outline';
    },
  });

  return priority || 'tertiary';
};
