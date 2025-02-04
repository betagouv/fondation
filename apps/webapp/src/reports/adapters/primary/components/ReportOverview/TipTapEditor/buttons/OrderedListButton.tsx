import { Editor } from "@tiptap/react";
import { EditorButton } from "./EditorButton";

export const OrderedListButton = () => {
  const getDisabled = (editor: Editor) =>
    !editor.can().chain().focus().toggleOrderedList().run();

  const toggleOrderedList = (editor: Editor) => () => {
    editor.chain().focus().toggleOrderedList().run();
  };

  return (
    <EditorButton
      iconId="fr-icon-list-ordered"
      title="Liste ordonnée"
      mark="orderedList"
      disabledFactory={getDisabled}
      onClickFactory={toggleOrderedList}
    />
  );
};
