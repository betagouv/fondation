import { useCurrentEditor, useEditorState } from "@tiptap/react";
import { FC } from "react";
import { headingLevels } from "../constant";
import { EditorButton } from "./EditorButton";

export const BoldButton: FC = () => {
  const { editor } = useCurrentEditor();
  const disabled = useEditorState({
    editor,
    selector: (ctx) => {
      const currentEditor = ctx.editor;
      if (!currentEditor) return true;

      const isHeadingActive = !!headingLevels.find((level) =>
        currentEditor.isActive("heading", { level }),
      );
      return (
        !currentEditor.can().chain().focus().toggleBold().run() ||
        isHeadingActive
      );
    },
  });

  const toggleBold = () => {
    if (!editor) return;
    editor.chain().focus().toggleBold().run();
  };

  return (
    <EditorButton
      iconId="fr-icon-bold"
      title="Gras"
      mark="bold"
      disabled={!!disabled}
      onClick={toggleBold}
    />
  );
};
