import { useCurrentEditor, useEditorState } from '@tiptap/react';
import { useIntl } from 'react-intl';

import { EditorButton } from './EditorButton';

export function CalloutButton() {
  const { formatMessage } = useIntl();
  const { editor } = useCurrentEditor();
  const disabled = useEditorState({
    editor,
    selector: (ctx) => !ctx.editor || !ctx.editor.can().toggleCallout(),
  });

  return (
    <EditorButton
      disabled={!!disabled}
      iconId="fr-icon-lightbulb-line"
      mark="callout"
      onClick={() => editor?.chain().focus().toggleCallout().run()}
      title={formatMessage({ defaultMessage: 'Encadré' })}
    />
  );
}
