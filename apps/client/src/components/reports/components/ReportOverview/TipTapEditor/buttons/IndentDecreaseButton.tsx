import { useCurrentEditor, useEditorState } from "@tiptap/react";
import type { FC } from "react";
import { EditorButton } from "./EditorButton";

export const IndentDecreaseButton: FC = () => {
  const { editor } = useCurrentEditor();
  const disabled = useEditorState({
    editor,
    selector: (ctx) => {
      if (!ctx.editor) return true;

      const cannotToggleList =
        !ctx.editor.can().chain().focus().toggleBulletList().run() &&
        !ctx.editor.can().chain().focus().toggleOrderedList().run();

      return (
        cannotToggleList ||
        !ctx.editor.can().chain().focus().liftListItem("listItem").run()
      );
    },
  });

  const decreaseIndent = () => {
    if (!editor) return;
    editor.chain().focus().liftListItem("listItem").run();
  };

  return (
    <EditorButton
      onClick={decreaseIndent}
      disabled={!!disabled}
      iconId="ri-indent-decrease"
      title="Diminuer le retrait"
    />
  );
};
