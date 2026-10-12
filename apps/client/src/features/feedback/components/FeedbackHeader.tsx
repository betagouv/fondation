import { FormattedMessage, useIntl } from 'react-intl';

import { Breadcrumb } from '@/shared/ui/Breadcrumb';
import { DetailsHeader } from '@/shared/ui/details';

export function FeedbackHeader() {
  const { formatMessage } = useIntl();

  return (
    <DetailsHeader
      backTo="/"
      breadcrumb={
        <Breadcrumb
          ariaLabel={formatMessage({ defaultMessage: "Fil d'Ariane de l'avis sur Fondation" })}
          breadcrumb={{
            currentPageLabel: formatMessage({ defaultMessage: 'Mon avis' }),
            segments: [{ label: formatMessage({ defaultMessage: 'Accueil' }), to: '/' }],
          }}
          className="fr-mt-0"
          id="feedback-breadcrumb"
        />
      }
      description={
        <FormattedMessage defaultMessage="Quelques questions sur votre travail avec Fondation. Dans les résultats, vos réponses apparaissent sous un numéro et jamais sous votre nom." />
      }
      title={<FormattedMessage defaultMessage="Votre avis sur Fondation" />}
    />
  );
}
