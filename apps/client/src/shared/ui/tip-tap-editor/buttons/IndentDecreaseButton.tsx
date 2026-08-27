import { useCurrentEditor, useEditorState } from '@tiptap/react';

import { EditorButton } from './EditorButton';

export function IndentDecreaseButton() {
  const { editor } = useCurrentEditor();
  const disabled = useEditorState({
    editor,
    selector: (ctx) => {
      if (!ctx.editor) return true;

      const cannotToggleList = !ctx.editor.can().toggleBulletList() && !ctx.editor.can().toggleOrderedList();
      return cannotToggleList || !ctx.editor.can().liftListItem('listItem');
    },
  });

  const decreaseIndent = () => {
    if (!editor) return;
    editor.chain().focus().liftListItem('listItem').run();
  };

  return (
    <EditorButton
      disabled={!!disabled}
      iconId="ri-indent-decrease"
      onClick={decreaseIndent}
      title="Diminuer le retrait"
    />
  );
}
