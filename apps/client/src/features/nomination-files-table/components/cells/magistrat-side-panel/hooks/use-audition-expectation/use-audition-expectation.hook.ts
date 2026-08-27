import { useIntl } from 'react-intl';

import { useIsSgNavigation } from '@/features/auth/hooks/roles.hook';
import { areReportersMissing, isAuditionMissing } from '@/utils/audition-expectation.util';
import type { SessionNominationFile } from '@queries/nomination-sessions.queries';

export type AuditionExpectation = {
  auditionMissing: boolean;
  labels: string[];
  reportersMissing: boolean;
};

export function useAuditionExpectation(
  nominationFile: SessionNominationFile,
  options: { selectedReportersCount?: number } = {},
): AuditionExpectation {
  const { formatMessage } = useIntl();
  const isSg = useIsSgNavigation();

  const auditionMissing = isAuditionMissing(nominationFile);
  const reportersMissing = areReportersMissing(
    {
      canAffectReporters: nominationFile.content.isUpdatable,
      expectedReportersCount: nominationFile.expectedReportersCount,
    },
    options.selectedReportersCount ?? nominationFile.reporters.length,
  );
  const reportersAnnounced = isSg && reportersMissing;

  function labels() {
    const announcements: string[] = [];
    if (auditionMissing)
      announcements.push(formatMessage({ defaultMessage: 'Une audition est à prévoir pour ce poste' }));
    if (reportersAnnounced)
      announcements.push(formatMessage({ defaultMessage: '2 rapporteurs sont attendus pour ce poste' }));

    return announcements;
  }

  return { auditionMissing, labels: labels(), reportersMissing };
}
