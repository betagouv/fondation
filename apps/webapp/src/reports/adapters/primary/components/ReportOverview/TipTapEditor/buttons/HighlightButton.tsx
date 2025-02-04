import { Editor } from "@tiptap/react";
import { EditorButton } from "./EditorButton";

export const HighlightButton = () => {
  const getDisabled = (editor: Editor) =>
    !editor.can().chain().focus().toggleHighlight().run();

  const toggleHighlight = (editor: Editor) => () => {
    editor.chain().focus().toggleHighlight().run();
  };

  return (
    <EditorButton
      iconId="fr-icon-mark-pen-line"
      title="Surligner"
      mark="highlight"
      disabledFactory={getDisabled}
      onClickFactory={toggleHighlight}
    />
  );
};
