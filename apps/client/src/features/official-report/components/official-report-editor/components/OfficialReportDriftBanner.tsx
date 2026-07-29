import Badge from '@codegouvfr/react-dsfr/Badge';
import ButtonsGroup from '@codegouvfr/react-dsfr/ButtonsGroup';
import Tooltip from '@codegouvfr/react-dsfr/Tooltip';
import { type ReactNodeViewProps } from '@tiptap/react';
import clsx from 'clsx';
import { FormattedMessage, useIntl } from 'react-intl';

function OfficialReportDriftBannerTooltip() {
  const { formatMessage } = useIntl();

  const tooltipTitle = formatMessage({ defaultMessage: `Contenu invalide` });
  const tooltipDescription = formatMessage({
    defaultMessage: `Des modifications ont eu lieu qui peuvent rendre ce contenu invalide.`,
  });

  return (
    <>
      <span className="font-bold">{tooltipTitle}</span>
      <span className="fr-ml-1v">{tooltipDescription}</span>
    </>
  );
}

export function OfficialReportDriftBanner(props: ReactNodeViewProps) {
  const { editor, node } = props;
  const { outdated, generatedHtml, isPending } = node.attrs;

  const disabled = Boolean(isPending);

  const onReset = () => editor.commands.resetBlock(props);
  const onAcknowledge = () => editor.commands.acknowledgeBlock(props);

  if (!outdated) return null;

  return (
    <div
      contentEditable={false}
      className={clsx('doc-block__banner doc-block__banner--info', {
        'bg-(--background-disabled-grey)': Boolean(isPending),
      })}
    >
      <Badge as="p" severity="new" small className="fr-mr-1v">
        <FormattedMessage defaultMessage="MODIFICATION" />
      </Badge>
      <Tooltip title={<OfficialReportDriftBannerTooltip />} />
      <div className="fr-mt-1v">
        <div dangerouslySetInnerHTML={{ __html: generatedHtml }} />
      </div>
      <div className="fr-mt-3v">
        <ButtonsGroup
          className="m-0 list-none p-0"
          buttonsSize="small"
          inlineLayoutWhen="md and up"
          alignment="left"
          buttons={[
            {
              disabled,
              priority: 'primary',
              onClick: onReset,
              children: <FormattedMessage defaultMessage="Accepter" />,
            },
            {
              disabled,
              priority: 'secondary',
              onClick: onAcknowledge,
              children: <FormattedMessage defaultMessage="Ignorer" />,
            },
          ]}
        />
      </div>
    </div>
  );
}
