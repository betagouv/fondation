import { useCurrentEditor, useEditorState } from '@tiptap/react';

import { headingLevels } from '../extensions/constant';

import { EditorButton } from './EditorButton';

export function BoldButton() {
  const { editor } = useCurrentEditor();
  const disabled = useEditorState({
    editor,
    selector: (ctx) => {
      const currentEditor = ctx.editor;
      if (!currentEditor) return true;

      const isHeadingActive = !!headingLevels.find((level) => currentEditor.isActive('heading', { level }));
      return !currentEditor.can().toggleBold() || isHeadingActive;
    },
  });

  const toggleBold = () => {
    if (!editor) return;
    editor.chain().focus().toggleBold().run();
  };

  return (
    <EditorButton disabled={!!disabled} iconId="fr-icon-bold" mark="bold" onClick={toggleBold} title="Gras" />
  );
}
