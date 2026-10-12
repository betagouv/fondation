import { FormattedMessage } from 'react-intl';

import { AlertBanner, AlertBannerLink } from '@/shared/ui/alert-banner';

export function PresentationDriftBanner(props: { editionPath?: string }) {
  return (
    <AlertBanner
      className="justify-center px-4 py-3 text-center"
      icon="fr-icon-warning-fill"
      message={<FormattedMessage defaultMessage="Cette notice ne correspond plus aux ordres du jour" />}
      tone="warning"
    >
      {props.editionPath && (
        <AlertBannerLink to={props.editionPath}>
          <FormattedMessage defaultMessage="Mettre à jour la notice" />
        </AlertBannerLink>
      )}
    </AlertBanner>
  );
}
