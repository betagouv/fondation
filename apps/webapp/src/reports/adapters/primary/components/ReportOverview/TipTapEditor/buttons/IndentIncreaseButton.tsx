import { Editor } from "@tiptap/react";
import { EditorButton } from "./EditorButton";

export const IndentIncreaseButton = () => {
  const increaseIndent = (editor: Editor) => () =>
    editor.chain().focus().sinkListItem("listItem").run();

  const getDisabled = (editor: Editor) =>
    !editor.can().chain().focus().toggleBulletList().run() ||
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
