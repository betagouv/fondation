import { FormattedMessage } from 'react-intl';

import { AlertBanner, AlertBannerLink } from '@/shared/ui/alert-banner';

export function AgendaReportersChangedBanner(props: { editionPath?: string; propositions: number }) {
  const { editionPath, propositions } = props;

  return (
    <AlertBanner
      className="justify-center px-4 py-3 text-center"
      icon="fr-icon-info-fill"
      message={
        propositions > 0 ? (
          <FormattedMessage
            defaultMessage="{count, plural, one {Les rapporteurs d'une proposition ont changé depuis la réécriture de son texte} other {Les rapporteurs de # propositions ont changé depuis la réécriture de leur texte}}"
            values={{ count: propositions }}
          />
        ) : (
          <FormattedMessage defaultMessage="Des rapporteurs ont changé depuis la réécriture du texte" />
        )
      }
      tone="info"
    >
      {editionPath && (
        <AlertBannerLink to={editionPath}>
          {propositions > 1 ? (
            <FormattedMessage defaultMessage="Voir les propositions" />
          ) : (
            <FormattedMessage defaultMessage="Voir la proposition" />
          )}
        </AlertBannerLink>
      )}
    </AlertBanner>
  );
}
