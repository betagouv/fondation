import { useCurrentEditor, useEditorState } from '@tiptap/react';

import { EditorButton } from './EditorButton';

export function OrderedListButton() {
  const { editor } = useCurrentEditor();
  const disabled = useEditorState({
    editor,
    selector: (ctx) => !ctx.editor || !ctx.editor.can().toggleOrderedList(),
  });

  const toggleOrderedList = () => {
    if (!editor) return;
    editor.chain().focus().toggleOrderedList().run();
  };

  return (
    <EditorButton
      disabled={!!disabled}
      iconId="fr-icon-list-ordered"
      mark="orderedList"
      onClick={toggleOrderedList}
      title="Liste ordonnée"
    />
  );
}
