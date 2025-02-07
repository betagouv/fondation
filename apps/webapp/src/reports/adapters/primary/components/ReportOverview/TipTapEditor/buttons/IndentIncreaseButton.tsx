import { Editor } from "@tiptap/react";
import { EditorButton } from "./EditorButton";

export const IndentIncreaseButton = () => {
  const increaseIndent = (editor: Editor) => () =>
    editor.chain().focus().sinkListItem("listItem").run();

  const cannotToggleList = (editor: Editor) =>
    !editor.can().chain().focus().toggleBulletList().run() &&
    !editor.can().chain().focus().toggleOrderedList().run();

  const getDisabled = (editor: Editor) =>
    cannotToggleList(editor) ||
    !editor.can().chain().focus().sinkListItem("listItem").run();

  return (
    <EditorButton
      onClickFactory={increaseIndent}
      disabledFactory={getDisabled}
      iconId="ri-indent-increase"
      title="Augmenter le retrait"
    />
  );
};
