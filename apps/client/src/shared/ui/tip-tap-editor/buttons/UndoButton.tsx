import { useCurrentEditor, useEditorState } from '@tiptap/react';
import { useIntl } from 'react-intl';

import { EditorButton } from './EditorButton';

export function UndoButton() {
  const { formatMessage } = useIntl();
  const { editor } = useCurrentEditor();
  const disabled = useEditorState({
    editor,
    selector: (ctx) => !ctx.editor || !ctx.editor.can().undo(),
  });

  const undoChanges = () => {
    if (!editor) return;
    editor.chain().focus().undo().run();
  };

  return (
    <EditorButton
      disabled={!!disabled}
      iconId="fr-icon-arrow-go-back-line"
      mark="undo"
      onClick={undoChanges}
      title={formatMessage({ defaultMessage: 'Annuler' })}
    />
  );
}
