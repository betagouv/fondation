import { Editor } from "@tiptap/react";
import { EditorButton } from "./EditorButton";

export const UnderlineButton = () => {
  const getDisabled = (editor: Editor) =>
    !editor.can().chain().focus().toggleUnderline().run();

  const toggleUnderline = (editor: Editor) => () => {
    editor.chain().focus().toggleUnderline().run();
  };

  return (
    <EditorButton
      iconId="ri-underline"
      title="Souligner"
      mark="underline"
      disabledFactory={getDisabled}
      onClickFactory={toggleUnderline}
    />
  );
};
