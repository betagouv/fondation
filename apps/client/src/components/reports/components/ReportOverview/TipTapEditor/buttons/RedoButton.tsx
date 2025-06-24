import { useCurrentEditor, useEditorState } from "@tiptap/react";
import { FC } from "react";
import { EditorButton } from "./EditorButton";

export const RedoButton: FC = () => {
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
      iconId="fr-icon-arrow-go-forward-line"
      title="Rétablir"
      mark="redo"
      disabled={!!disabled}
      onClick={redoChanges}
    />
  );
};
