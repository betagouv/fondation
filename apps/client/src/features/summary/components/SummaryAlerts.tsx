import { FormattedMessage } from 'react-intl';

import { useIsSg } from '@/features/auth/hooks/roles.hook';
import { useSummary } from '@/features/summary/context/SummaryContext';
import { AuditionScheduledBanner } from '@/shared/components/audition-banner';
import { NominationFileOutcomeEnum } from '@/shared/enums/nomination-file-outcome.enum';
import { AlertBanner } from '@/shared/ui/alert-banner';

const BANNER_LAYOUT = 'rounded px-4 py-3';

export function SummaryAlerts() {
  const isSg = useIsSg();
  const { summary } = useSummary();
  // a summary stays relevant for a file on which the decision is suspended
  const outcome = summary.outcome?.value === NominationFileOutcomeEnum.SUSPENDED ? null : summary.outcome;

  return (
    <div className="flex flex-col gap-2 empty:hidden">
      {outcome && (
        <AlertBanner
          className={BANNER_LAYOUT}
          icon="fr-icon-warning-fill"
          message={
            isSg ? (
              <FormattedMessage
                defaultMessage={`L'issue "{label}" a déjà été renseignée pour ce dossier : une synthèse n'est probablement plus nécessaire`}
                values={{ label: outcome.label }}
              />
            ) : (
              <FormattedMessage
                defaultMessage={`L'issue "{label}" a déjà été renseignée pour ce dossier : cette synthèse n'est peut-être plus d'actualité`}
                values={{ label: outcome.label }}
              />
            )
          }
          tone="warning"
        />
      )}
      <AuditionScheduledBanner
        className={BANNER_LAYOUT}
        date={summary.auditionDate}
        time={summary.auditionTime}
      />
      {summary.missingEvaluation && (
        <AlertBanner
          className={BANNER_LAYOUT}
          icon="fr-icon-draft-line"
          message={
            <FormattedMessage defaultMessage="Évaluation manquante dans le dossier administratif LOLFI" />
          }
          tone="warning"
        />
      )}
    </div>
  );
}
