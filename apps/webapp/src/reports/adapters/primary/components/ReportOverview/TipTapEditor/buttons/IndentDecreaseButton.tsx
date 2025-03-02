import { Editor } from "@tiptap/react";
import { EditorButton } from "./EditorButton";

export const IndentDecreaseButton = () => {
  const decreaseIndent = (editor: Editor) => () =>
    editor.chain().focus().liftListItem("listItem").run();

  const cannotToggleList = (editor: Editor) =>
    !editor.can().chain().focus().toggleBulletList().run() &&
    !editor.can().chain().focus().toggleOrderedList().run();

  const getDisabled = (editor: Editor) =>
    cannotToggleList(editor) ||
    !editor.can().chain().focus().liftListItem("listItem").run();

  return (
    <EditorButton
      onClickFactory={decreaseIndent}
      disabledFactory={getDisabled}
      iconId="ri-indent-decrease"
      title="Diminuer le retrait"
    />
  );
};
