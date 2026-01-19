import Notice from '@codegouvfr/react-dsfr/Notice';

import { useSummary } from '@/pages/summary/SummaryContext';
import { outcomeLabels } from '@/types/enums.types';
import { useUser } from '@queries/auth.queries';

export function SummaryOutcomeNotice() {
  const { user } = useUser();
  const { summary } = useSummary();
  const outcome = summary.outcome?.value;

  if (!outcome) return null;

  const { label } = outcomeLabels({ formation: summary.formation, value: outcome });

  return (
    <Notice
      className="mb-12 rounded-lg"
      severity="warning"
      title={
        <>
          L'issue "<span className="underline">{label}</span>" a déjà été renseignée pour ce dossier
        </>
      }
      description={
        user?.role === 'ADJOINT_SECRETAIRE_GENERAL'
          ? `une synthèse n'est probablement plus nécessaire`
          : `cette synthèse n'est peut-être plus d'actualité`
      }
    />
  );
}
