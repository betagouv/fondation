import { useSummary } from '@/pages/summary/SummaryContext';
import { outcomeLabels } from '@/types/enums.types';
import Notice from '@codegouvfr/react-dsfr/Notice';

export function SummaryOutcomeNotice() {
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
      description="une synthèse n'est probablement plus nécessaire"
    />
  );
}
