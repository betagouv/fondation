import { useCurrentEditor, useEditorState } from "@tiptap/react";
import { FC } from "react";
import { HeadingLevel } from "../constant";
import { EditorButton } from "./EditorButton";

type HeadingButtonProps = {
  level: HeadingLevel;
};

export const HeadingButton: FC<HeadingButtonProps> = ({ level }) => {
  const { editor } = useCurrentEditor();
  const disabled = useEditorState({
    editor,
    selector: (ctx) =>
      !ctx.editor ||
      !ctx.editor.can().chain().focus().toggleHeading({ level }).run(),
  });

  const toggleHeading = () => {
    if (!editor) return;
    editor.chain().focus().toggleHeading({ level }).run();
  };

  return (
    <EditorButton
      iconId={`fr-icon-h-${level}`}
      title={`H${level}`}
      mark="heading"
      attributes={{ level }}
      onClick={toggleHeading}
      disabled={!!disabled}
    />
  );
};
