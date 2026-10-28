import { useCurrentEditor, useEditorState } from '@tiptap/react';
import { useIntl } from 'react-intl';

import { EditorButton } from './EditorButton';

export function OrderedListButton() {
  const { formatMessage } = useIntl();
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
      title={formatMessage({ defaultMessage: 'Liste ordonnée' })}
    />
  );
}
