import { Editor } from "@tiptap/react";
import { EditorButton } from "./EditorButton";

export const ItalicButton = () => {
  const getDisabled = (editor: Editor) =>
    !editor.can().chain().focus().toggleItalic().run();

  const toggleItalic = (editor: Editor) => () => {
    editor.chain().focus().toggleItalic().run();
  };

  return (
    <EditorButton
      iconId="fr-icon-italic"
      title="Italique"
      mark="italic"
      disabledFactory={getDisabled}
      onClickFactory={toggleItalic}
    />
  );
};
