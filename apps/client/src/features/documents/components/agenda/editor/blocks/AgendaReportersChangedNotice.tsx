import Button from '@codegouvfr/react-dsfr/Button';
import { type ReactNodeViewProps } from '@tiptap/react';
import { FormattedMessage, useIntl } from 'react-intl';

export function AgendaReportersChangedNotice(props: ReactNodeViewProps) {
  const { formatList } = useIntl();
  const { editor, node } = props;
  const { isPending, outdated, reporters } = node.attrs as {
    isPending: boolean;
    outdated: boolean;
    reporters: string[];
  };

  if (!outdated) return null;

  return (
    <div
      className="doc-block__banner doc-block__banner--info fr-mt-3v flex flex-wrap items-center justify-between gap-2"
      contentEditable={false}
    >
      <span>
        {reporters.length > 0 ? (
          <FormattedMessage
            defaultMessage="Les rapporteurs de ce dossier ont changé depuis la réécriture du texte : {reporters}."
            values={{ reporters: formatList(reporters, { type: 'conjunction' }) }}
          />
        ) : (
          <FormattedMessage defaultMessage="Ce dossier n'a plus de rapporteur depuis la réécriture du texte." />
        )}
      </span>
      <Button
        disabled={isPending}
        onClick={() => editor.commands.acknowledgeBlock(props)}
        priority="secondary"
        size="small"
      >
        <FormattedMessage defaultMessage="C'est noté" />
      </Button>
    </div>
  );
}
