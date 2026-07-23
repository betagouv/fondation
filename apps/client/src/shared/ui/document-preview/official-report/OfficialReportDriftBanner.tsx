import Badge from '@codegouvfr/react-dsfr/Badge';
import ButtonsGroup from '@codegouvfr/react-dsfr/ButtonsGroup';
import Tooltip from '@codegouvfr/react-dsfr/Tooltip';
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

export function OfficialReportDriftBanner(props: {
  onReset: () => void;
  onAcknowledge: () => void;
  generatedHtml: string;
}) {
  return (
    <div contentEditable={false} className="doc-block__banner doc-block__banner--info">
      <Badge as="p" severity="new" small className="fr-mr-1v">
        <FormattedMessage defaultMessage="MODIFICATION" />
      </Badge>
      <Tooltip title={<OfficialReportDriftBannerTooltip />} />
      <div className="fr-mt-1v">
        <div dangerouslySetInnerHTML={{ __html: props.generatedHtml }} />
      </div>
      <div className="fr-mt-3v">
        <ButtonsGroup
          className="m-0 list-none p-0"
          buttonsSize="small"
          inlineLayoutWhen="md and up"
          alignment="left"
          buttons={[
            {
              priority: 'primary',
              onClick: props.onReset,
              children: <FormattedMessage defaultMessage="Accepter" />,
            },
            {
              priority: 'secondary',
              onClick: props.onAcknowledge,
              children: <FormattedMessage defaultMessage="Ignorer" />,
            },
          ]}
        />
      </div>
    </div>
  );
}
