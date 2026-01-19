import { useCurrentEditor, useEditorState } from '@tiptap/react';
import type { FC } from 'react';
import { EditorButton } from './EditorButton';

export const IndentDecreaseButton: FC = () => {
  const { editor } = useCurrentEditor();
  const disabled = useEditorState({
    editor,
    selector: (ctx) => {
      if (!ctx.editor) return true;

      const cannotToggleList = !ctx.editor.can().toggleBulletList() && !ctx.editor.can().toggleOrderedList();
      return cannotToggleList || !ctx.editor.can().liftListItem('listItem');
    }
  });

  const decreaseIndent = () => {
    if (!editor) return;
    editor.chain().focus().liftListItem('listItem').run();
  };

  return (
    <EditorButton
      onClick={decreaseIndent}
      disabled={!!disabled}
      iconId="ri-indent-decrease"
      title="Diminuer le retrait"
    />
  );
};
