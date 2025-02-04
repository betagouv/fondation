import { Editor } from "@tiptap/react";
import { EditorButton } from "./EditorButton";

export const BulletListButton = () => {
  const toggleBulletList = (editor: Editor) => () =>
    editor.chain().focus().toggleBulletList().run();

  const getDisabled = (editor: Editor) =>
    !editor.can().chain().focus().toggleBulletList().run();

  return (
    <EditorButton
      iconId="fr-icon-list-unordered"
      title="Liste à puces"
      mark="bulletList"
      onClickFactory={toggleBulletList}
      disabledFactory={getDisabled}
    />
  );
};
