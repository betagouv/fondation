import Notice from '@codegouvfr/react-dsfr/Notice';
import { FormattedMessage } from 'react-intl';

import { useIsSg } from '@/features/auth/hooks/roles.hook';
import { useSummary } from '@/features/summary/context/SummaryContext';

export function SummaryOutcomeNotice() {
  const isSg = useIsSg();
  const { summary } = useSummary();
  const label = summary.outcome?.label;

  if (!label) return null;

  return (
    <Notice
      className="fr-mb-12v rounded-lg"
      description={
        isSg ? (
          <FormattedMessage defaultMessage="une synthèse n'est probablement plus nécessaire" />
        ) : (
          <FormattedMessage defaultMessage="cette synthèse n'est peut-être plus d'actualité" />
        )
      }
      severity="warning"
      title={
        <FormattedMessage
          defaultMessage={`L'issue "{label}" a déjà été renseignée pour ce dossier`}
          values={{ label: <span className="underline">{label}</span> }}
        />
      }
    />
  );
}
