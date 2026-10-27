import { useCurrentEditor, useEditorState } from '@tiptap/react';
import { useIntl } from 'react-intl';

import { EditorButton } from './EditorButton';

export function HorizontalRuleButton() {
  const { formatMessage } = useIntl();
  const { editor } = useCurrentEditor();
  const disabled = useEditorState({
    editor,
    selector: (ctx) => !ctx.editor || !ctx.editor.can().setHorizontalRule(),
  });

  return (
    <EditorButton
      disabled={!!disabled}
      iconId="ri-separator"
      onClick={() => editor?.chain().focus().setHorizontalRule().run()}
      title={formatMessage({ defaultMessage: 'Séparateur' })}
    />
  );
}
