import { useCurrentEditor, useEditorState } from '@tiptap/react';
import type { FC } from 'react';
import { EditorButton } from './EditorButton';

export const ItalicButton: FC = () => {
  const { editor } = useCurrentEditor();
  const disabled = useEditorState({
    editor,
    selector: (ctx) => !ctx.editor || !ctx.editor.can().chain().focus().toggleItalic().run()
  });

  const toggleItalic = () => {
    if (!editor) return;
    editor.chain().focus().toggleItalic().run();
  };

  return (
    <EditorButton
      iconId="fr-icon-italic"
      title="Italique"
      mark="italic"
      disabled={!!disabled}
      onClick={toggleItalic}
    />
  );
};
