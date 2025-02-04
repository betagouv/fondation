import { Editor } from "@tiptap/react";
import { HeadingLevel } from "../constant";
import { EditorButton } from "./EditorButton";

export const HeadingButton = ({ level }: { level: HeadingLevel }) => {
  const toggleHeading = (editor: Editor) => () =>
    editor.chain().focus().toggleHeading({ level }).run();

  const getDisabled = (editor: Editor) =>
    !editor.can().chain().focus().toggleHeading({ level }).run();

  return (
    <EditorButton
      iconId={`fr-icon-h-${level}`}
      title={`H${level}`}
      mark="heading"
      attributes={{ level }}
      onClickFactory={toggleHeading}
      disabledFactory={getDisabled}
    />
  );
};
