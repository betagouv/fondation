import { useCurrentEditor, useEditorState } from "@tiptap/react";
import { FC } from "react";
import { EditorButton } from "./EditorButton";

export const UnderlineButton: FC = () => {
  const { editor } = useCurrentEditor();
  const disabled = useEditorState({
    editor,
    selector: (ctx) =>
      !ctx.editor || !ctx.editor.can().chain().focus().toggleUnderline().run(),
  });

  const toggleUnderline = () => {
    if (!editor) return null;
    editor.chain().focus().toggleUnderline().run();
  };

  return (
    <EditorButton
      iconId="ri-underline"
      title="Souligner"
      mark="underline"
      disabled={!!disabled}
      onClick={toggleUnderline}
    />
  );
};
