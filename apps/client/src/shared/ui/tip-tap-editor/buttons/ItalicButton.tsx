import { useCurrentEditor, useEditorState } from '@tiptap/react';

import { EditorButton } from './EditorButton';

export function ItalicButton() {
  const { editor } = useCurrentEditor();
  const disabled = useEditorState({
    editor,
    selector: (ctx) => !ctx.editor || !ctx.editor.can().toggleItalic(),
  });

  const toggleItalic = () => {
    if (!editor) return;
    editor.chain().focus().toggleItalic().run();
  };

  return (
    <EditorButton
      disabled={!!disabled}
      iconId="fr-icon-italic"
      mark="italic"
      onClick={toggleItalic}
      title="Italique"
    />
  );
}
