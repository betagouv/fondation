import { useCurrentEditor, useEditorState } from '@tiptap/react';
import { useIntl } from 'react-intl';

import { headingLevels } from '../extensions/constant';

import { EditorButton } from './EditorButton';

export function BoldButton() {
  const { formatMessage } = useIntl();
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
    <EditorButton
      disabled={!!disabled}
      iconId="fr-icon-bold"
      mark="bold"
      onClick={toggleBold}
      title={formatMessage({ defaultMessage: 'Gras' })}
    />
  );
}
