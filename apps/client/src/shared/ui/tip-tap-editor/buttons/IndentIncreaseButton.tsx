import { useCurrentEditor, useEditorState } from '@tiptap/react';

import { EditorButton } from './EditorButton';

export function IndentIncreaseButton() {
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
      disabled={!!disabled}
      iconId="ri-indent-increase"
      onClick={increaseIndent}
      title="Augmenter le retrait"
    />
  );
}
