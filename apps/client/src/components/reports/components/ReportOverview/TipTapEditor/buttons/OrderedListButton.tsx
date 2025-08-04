import { useCurrentEditor, useEditorState } from "@tiptap/react";
import type { FC } from "react";
import { EditorButton } from "./EditorButton";

export const OrderedListButton: FC = () => {
  const { editor } = useCurrentEditor();
  const disabled = useEditorState({
    editor,
    selector: (ctx) =>
      !ctx.editor ||
      !ctx.editor.can().chain().focus().toggleOrderedList().run(),
  });

  const toggleOrderedList = () => {
    if (!editor) return;
    editor.chain().focus().toggleOrderedList().run();
  };

  return (
    <EditorButton
      iconId="fr-icon-list-ordered"
      title="Liste ordonnée"
      mark="orderedList"
      disabled={!!disabled}
      onClick={toggleOrderedList}
    />
  );
};
