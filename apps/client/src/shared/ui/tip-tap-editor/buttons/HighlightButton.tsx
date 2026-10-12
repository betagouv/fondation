import { useCurrentEditor, useEditorState } from '@tiptap/react';

import { EditorButton } from './EditorButton';

export function HighlightButton() {
  const { editor } = useCurrentEditor();
  const disabled = useEditorState({
    editor,
    selector: (ctx) => !ctx.editor || !ctx.editor.can().toggleHighlight(),
  });

  const toggleHighlight = () => {
    if (!editor) return;
    editor.chain().focus().toggleHighlight().run();
  };

  return (
    <EditorButton
      disabled={!!disabled}
      iconId="fr-icon-mark-pen-line"
      mark="highlight"
      onClick={toggleHighlight}
      title="Surligner"
    />
  );
}
