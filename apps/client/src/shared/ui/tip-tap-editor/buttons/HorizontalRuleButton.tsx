import { useCurrentEditor, useEditorState } from '@tiptap/react';

import { EditorButton } from './EditorButton';

export function HorizontalRuleButton() {
  const { editor } = useCurrentEditor();
  const disabled = useEditorState({
    editor,
    selector: (ctx) => !ctx.editor || !ctx.editor.can().setHorizontalRule(),
  });

  return (
    <EditorButton
      disabled={!!disabled}
      iconId="ri-separator"
      onClick={() => editor?.chain().focus().setHorizontalRule().run()}
      title="Séparateur"
    />
  );
}
