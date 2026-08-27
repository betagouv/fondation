import { useCurrentEditor, useEditorState } from '@tiptap/react';

import { EditorButton } from './EditorButton';

export function UndoButton() {
  const { editor } = useCurrentEditor();
  const disabled = useEditorState({
    editor,
    selector: (ctx) => !ctx.editor || !ctx.editor.can().undo(),
  });

  const undoChanges = () => {
    if (!editor) return;
    editor.chain().focus().undo().run();
  };

  return (
    <EditorButton
      disabled={!!disabled}
      iconId="fr-icon-arrow-go-back-line"
      mark="undo"
      onClick={undoChanges}
      title="Annuler"
    />
  );
}
