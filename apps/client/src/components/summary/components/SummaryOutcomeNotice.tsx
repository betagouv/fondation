import Notice from '@codegouvfr/react-dsfr/Notice';

import { useIsSg } from '@/hooks/roles.hook';
import { useSummary } from '@/pages/summary/SummaryContext';
import { outcomeLabel } from '@/types/enums.types';

export function SummaryOutcomeNotice() {
  const isSg = useIsSg();
  const { summary } = useSummary();
  const outcome = summary.outcome?.value;

  if (!outcome) return null;

  const label = outcomeLabel({ formation: summary.formation, value: outcome });

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
        isSg
          ? `une synthèse n'est probablement plus nécessaire`
          : `cette synthèse n'est peut-être plus d'actualité`
      }
    />
  );
}
