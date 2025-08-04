import { useCurrentEditor, useEditorState } from "@tiptap/react";
import type { FC } from "react";
import { EditorButton } from "./EditorButton";

export const HighlightButton: FC = () => {
  const { editor } = useCurrentEditor();
  const disabled = useEditorState({
    editor,
    selector: (ctx) =>
      !ctx.editor || !ctx.editor.can().chain().focus().toggleHighlight().run(),
  });

  const toggleHighlight = () => {
    if (!editor) return;
    editor.chain().focus().toggleHighlight().run();
  };

  return (
    <EditorButton
      iconId="fr-icon-mark-pen-line"
      title="Surligner"
      mark="highlight"
      disabled={!!disabled}
      onClick={toggleHighlight}
    />
  );
};
