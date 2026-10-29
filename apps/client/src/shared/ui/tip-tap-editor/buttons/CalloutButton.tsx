import { useCurrentEditor, useEditorState } from '@tiptap/react';
import { useIntl } from 'react-intl';

import type { CalloutKind } from '../extensions/callout-extension';

import { EditorButton } from './EditorButton';

export function CalloutButton(props: { kind: CalloutKind }) {
  const { formatMessage } = useIntl();
  const { editor } = useCurrentEditor();
  const title =
    props.kind === 'tip'
      ? formatMessage({ defaultMessage: 'Bon à savoir' })
      : formatMessage({ defaultMessage: 'Attention' });
  const disabled = useEditorState({
    editor,
    selector: (ctx) => !ctx.editor || !ctx.editor.can().toggleCallout({ kind: props.kind, title }),
  });

  return (
    <EditorButton
      attributes={{ kind: props.kind }}
      disabled={!!disabled}
      iconId={props.kind === 'tip' ? 'fr-icon-lightbulb-line' : 'fr-icon-warning-line'}
      mark="callout"
      onClick={() => editor?.chain().focus().toggleCallout({ kind: props.kind, title }).run()}
      title={formatMessage({ defaultMessage: 'Encadré "{title}"' }, { title })}
    />
  );
}
