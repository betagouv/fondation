import { FormattedMessage } from 'react-intl';

import { AlertBanner, AlertBannerAction } from '@/shared/ui/alert-banner';

export function MissingSecondReporterNotice(props: { editable: boolean; onAffect: () => void }) {
  return (
    <AlertBanner
      className="fr-mb-n8v -mx-8 px-8 py-4"
      icon="fr-icon-warning-fill"
      message={<FormattedMessage defaultMessage="2 rapporteurs sont attendus pour ce poste" />}
      tone="warning"
    >
      {props.editable && (
        <AlertBannerAction onClick={props.onAffect}>
          <FormattedMessage defaultMessage="Affecter" />
        </AlertBannerAction>
      )}
    </AlertBanner>
  );
}
