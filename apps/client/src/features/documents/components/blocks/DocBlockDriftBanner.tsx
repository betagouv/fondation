import Badge from '@codegouvfr/react-dsfr/Badge';
import ButtonsGroup from '@codegouvfr/react-dsfr/ButtonsGroup';
import { type ReactNodeViewProps } from '@tiptap/react';
import clsx from 'clsx';
import { FormattedMessage, useIntl } from 'react-intl';

import { Tooltip } from '@/shared/ui/tooltip';

function DocBlockDriftBannerTooltip(props: { acknowledgeable: boolean }) {
  const { formatMessage } = useIntl();

  const tooltipTitle = formatMessage({ defaultMessage: `Texte à arbitrer` });
  const tooltipDescription = props.acknowledgeable
    ? formatMessage({
        defaultMessage: `Le texte de cette proposition ne dit plus la même chose que celui proposé ici. Acceptez-le pour remplacer le vôtre, ignorez-le pour le conserver.`,
      })
    : formatMessage({
        defaultMessage: `Le texte de cette proposition ne dit plus la même chose que celui proposé ici. Acceptez-le pour remplacer le vôtre.`,
      });

  return (
    <>
      <span className="font-bold">{tooltipTitle}</span>
      <span className="fr-ml-1v">{tooltipDescription}</span>
    </>
  );
}

/** a block whose text is only ever written elsewhere cannot keep its own: it takes the proposal or waits */
export function DocBlockDriftBanner(props: ReactNodeViewProps & { acknowledgeable?: boolean }) {
  const { editor, node } = props;
  const { agendaHtml, generatedHtml, isPending, outdated } = node.attrs;
  const proposed = agendaHtml ?? generatedHtml;

  const disabled = Boolean(isPending);

  const onReset = () => editor.commands.resetBlock(props);
  const onAcknowledge = () => editor.commands.acknowledgeBlock(props);

  if (!outdated) return null;

  const accept = {
    children: <FormattedMessage defaultMessage="Accepter" />,
    disabled,
    onClick: onReset,
    priority: 'primary' as const,
  };
  const ignore = {
    children: <FormattedMessage defaultMessage="Ignorer" />,
    disabled,
    onClick: onAcknowledge,
    priority: 'secondary' as const,
  };

  return (
    <div
      className={clsx(
        'doc-block__banner',
        agendaHtml ? 'doc-block__banner--agenda' : 'doc-block__banner--info',
        {
          'bg-(--background-disabled-grey)': Boolean(isPending),
        },
      )}
      contentEditable={false}
    >
      <span className="flex flex-wrap items-center gap-x-2 gap-y-1">
        <Badge
          as="span"
          className={clsx(
            'fr-mb-0 text-(--text-default-grey)',
            agendaHtml ? 'bg-(--background-contrast-yellow-tournesol)' : 'bg-(--background-alt-grey)',
          )}
          noIcon
          small
        >
          {agendaHtml ? (
            <FormattedMessage defaultMessage="l'ordre du jour propose" />
          ) : (
            <FormattedMessage defaultMessage="le document propose" />
          )}
        </Badge>
        <Tooltip label={<DocBlockDriftBannerTooltip acknowledgeable={props.acknowledgeable !== false} />}>
          <i
            aria-hidden
            className="fr-icon-question-line fr-icon--sm text-(--text-action-high-blue-france)"
          />
        </Tooltip>
      </span>
      <div className="fr-mt-3v fr-mb-4v">
        <div dangerouslySetInnerHTML={{ __html: proposed }} />
      </div>
      <div>
        <ButtonsGroup
          alignment="right"
          buttons={props.acknowledgeable === false ? [accept] : [ignore, accept]}
          buttonsSize="small"
          className="m-0 list-none p-0 [&_.fr-btn]:mb-0!"
          inlineLayoutWhen="md and up"
        />
      </div>
    </div>
  );
}
