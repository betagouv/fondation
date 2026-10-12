import { useCurrentEditor, useEditorState } from '@tiptap/react';

import { EditorButton } from './EditorButton';

export function RedoButton() {
  const { editor } = useCurrentEditor();
  const disabled = useEditorState({
    editor,
    selector: (ctx) => !ctx.editor || !ctx.editor.can().redo(),
  });

  const redoChanges = () => {
    if (!editor) return;
    editor.chain().focus().redo().run();
  };

  return (
    <EditorButton
      disabled={!!disabled}
      iconId="fr-icon-arrow-go-forward-line"
      mark="redo"
      onClick={redoChanges}
      title="Rétablir"
    />
  );
}
