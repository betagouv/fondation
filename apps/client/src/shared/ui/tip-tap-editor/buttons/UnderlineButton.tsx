import { useCurrentEditor, useEditorState } from '@tiptap/react';

import { EditorButton } from './EditorButton';

export function UnderlineButton() {
  const { editor } = useCurrentEditor();
  const disabled = useEditorState({
    editor,
    selector: (ctx) => !ctx.editor || !ctx.editor.can().toggleUnderline(),
  });

  const toggleUnderline = () => {
    if (!editor) return null;
    editor.chain().focus().toggleUnderline().run();
  };

  return (
    <EditorButton
      disabled={!!disabled}
      iconId="ri-underline"
      mark="underline"
      onClick={toggleUnderline}
      title="Souligner"
    />
  );
}
