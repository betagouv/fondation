import { FormattedMessage } from 'react-intl';

import { useIsSg } from '@/features/auth/hooks/roles.hook';
import { useSummary } from '@/features/summary/context/SummaryContext';
import { AuditionScheduledBanner } from '@/shared/components/audition-banner';
import { NominationFileOutcomeEnum } from '@/shared/enums/nomination-file-outcome.enum';
import { AlertBanner } from '@/shared/ui/alert-banner';
import { isAuditionMissing } from '@/utils/audition-expectation.util';

export function SummaryAlerts() {
  const isSg = useIsSg();
  const { summary } = useSummary();
  // a summary stays relevant for a file on which the decision is suspended
  const outcome = summary.outcome?.value === NominationFileOutcomeEnum.SUSPENDED ? null : summary.outcome;
  const auditionMissing = isAuditionMissing(summary);

  return (
    <div className="flex flex-col empty:hidden">
      {outcome && (
        <AlertBanner
          fullWidth
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
      {isSg && (auditionMissing || summary.reportersMissing) && (
        <AlertBanner
          fullWidth
          icon="fr-icon-warning-fill"
          message={
            auditionMissing && summary.reportersMissing ? (
              <FormattedMessage defaultMessage="Une audition est à prévoir et 2 rapporteurs sont attendus pour ce poste" />
            ) : auditionMissing ? (
              <FormattedMessage defaultMessage="Une audition est à prévoir pour ce poste" />
            ) : (
              <FormattedMessage defaultMessage="2 rapporteurs sont attendus pour ce poste" />
            )
          }
          tone="warning"
        />
      )}
      <AuditionScheduledBanner date={summary.auditionDate} fullWidth time={summary.auditionTime} />
    </div>
  );
}
