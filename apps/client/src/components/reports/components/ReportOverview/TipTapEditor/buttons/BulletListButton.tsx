import { useCurrentEditor, useEditorState } from '@tiptap/react';
import type { FC } from 'react';

import { EditorButton } from './EditorButton';

export const BulletListButton: FC = () => {
  const { editor } = useCurrentEditor();
  const disabled = useEditorState({
    editor,
    selector: (ctx) => !ctx.editor || !ctx.editor.can().toggleBulletList(),
  });

  const toggleBulletList = () => {
    if (!editor) return;
    editor.chain().focus().toggleBulletList().run();
  };

  return (
    <EditorButton
      iconId="fr-icon-list-unordered"
      title="Liste à puces"
      mark="bulletList"
      onClick={toggleBulletList}
      disabled={!!disabled}
    />
  );
};
