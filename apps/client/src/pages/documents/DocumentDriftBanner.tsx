import { FormattedMessage } from 'react-intl';

import { AlertBanner, AlertBannerLink } from '@/shared/ui/alert-banner';

export function DocumentDriftBanner(props: { editionPath?: string; outdatedPropositions: number }) {
  const { editionPath } = props;

  return (
    <AlertBanner
      className="justify-center px-4 py-3 text-center"
      icon="fr-icon-warning-fill"
      message={
        props.outdatedPropositions > 0 ? (
          <FormattedMessage
            defaultMessage="Un autre texte est proposé pour {count, plural, one {une proposition} other {# propositions}}"
            values={{ count: props.outdatedPropositions }}
          />
        ) : (
          <FormattedMessage defaultMessage="Un autre texte est proposé dans ce document" />
        )
      }
      tone="warning"
    >
      {editionPath && (
        <AlertBannerLink to={editionPath}>
          {props.outdatedPropositions === 0 && <FormattedMessage defaultMessage="Voir le texte" />}
          {props.outdatedPropositions === 1 && <FormattedMessage defaultMessage="Voir la proposition" />}
          {props.outdatedPropositions > 1 && <FormattedMessage defaultMessage="Voir les propositions" />}
        </AlertBannerLink>
      )}
    </AlertBanner>
  );
}
