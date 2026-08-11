import { FormattedMessage } from 'react-intl';

import { AuditionScheduledBanner } from '@/shared/components/audition-banner';
import { AlertBanner } from '@/shared/ui/alert-banner';
import { isAuditionMissing } from '@/utils/audition-expectation.util';
import type { DetailedReportDto } from '@api/types';

const BANNER_LAYOUT = 'rounded px-4 py-3';

export function ReportAlerts({
  report,
}: {
  report: Pick<
    DetailedReportDto,
    'auditionDate' | 'auditionExpected' | 'auditionTime' | 'isArchived' | 'missingEvaluation'
  >;
}) {
  return (
    <div className="flex flex-col gap-2 empty:hidden">
      {isAuditionMissing(report) ? (
        <AlertBanner
          className={BANNER_LAYOUT}
          icon="fr-icon-warning-fill"
          message={<FormattedMessage defaultMessage="Une audition est à prévoir pour ce poste" />}
          tone="warning"
        />
      ) : (
        <AuditionScheduledBanner
          className={BANNER_LAYOUT}
          date={report.auditionDate}
          time={report.auditionTime}
        />
      )}
      {report.missingEvaluation && (
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
