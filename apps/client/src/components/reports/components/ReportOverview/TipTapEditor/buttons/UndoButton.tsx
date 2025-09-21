import { useCurrentEditor, useEditorState } from '@tiptap/react';
import type { FC } from 'react';
import { EditorButton } from './EditorButton';

export const UndoButton: FC = () => {
  const { editor } = useCurrentEditor();
  const disabled = useEditorState({
    editor,
    selector: (ctx) => !ctx.editor || !ctx.editor.can().undo()
  });

  const undoChanges = () => {
    if (!editor) return;
    editor.chain().focus().undo().run();
  };

  return (
    <EditorButton
      iconId="fr-icon-arrow-go-back-line"
      title="Annuler"
      mark="undo"
      disabled={!!disabled}
      onClick={undoChanges}
    />
  );
};
