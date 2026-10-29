import { useCurrentEditor, useEditorState } from '@tiptap/react';
import { useIntl } from 'react-intl';

import { EditorButton } from './EditorButton';

export function BulletListButton() {
  const { formatMessage } = useIntl();
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
      disabled={!!disabled}
      iconId="fr-icon-list-unordered"
      mark="bulletList"
      onClick={toggleBulletList}
      title={formatMessage({ defaultMessage: 'Liste à puces' })}
    />
  );
}
