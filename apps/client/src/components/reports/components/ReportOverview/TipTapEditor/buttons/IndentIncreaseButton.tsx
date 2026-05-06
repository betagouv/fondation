import { useCurrentEditor, useEditorState } from '@tiptap/react';
import type { FC } from 'react';

import { EditorButton } from './EditorButton';

export const IndentIncreaseButton: FC = () => {
  const { editor } = useCurrentEditor();
  const disabled = useEditorState({
    editor,
    selector: (ctx) => {
      if (!ctx.editor) return true;

      const cannotToggleList = !ctx.editor.can().toggleBulletList() && !ctx.editor.can().toggleOrderedList();
      return cannotToggleList || !ctx.editor.can().sinkListItem('listItem');
    },
  });

  const increaseIndent = () => {
    if (!editor) return;
    editor.chain().focus().sinkListItem('listItem').run();
  };

  return (
    <EditorButton
      onClick={increaseIndent}
      disabled={!!disabled}
      iconId="ri-indent-increase"
      title="Augmenter le retrait"
    />
  );
};
