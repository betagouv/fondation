import { useIntl } from 'react-intl';

import { useIsSgNavigation } from '@/features/auth/hooks/roles.hook';
import { areReportersMissing, isAuditionMissing } from '@/utils/audition-expectation.util';
import { isUpdatable, type SessionNominationFile } from '@queries/nomination-sessions.queries';

type AuditionExpectation = {
  /** the members hear about an audition to schedule, the secretariat is asked to schedule it */
  auditionAnnounced: boolean;
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
      canAffectReporters: isUpdatable(nominationFile),
      expectedReportersCount: nominationFile.expectedReportersCount,
    },
    options.selectedReportersCount ?? nominationFile.reporters.length,
  );
  const reportersAnnounced = isSg && reportersMissing;

  function labels() {
    const announcements: string[] = [];
    if (isSg && auditionMissing)
      announcements.push(
        nominationFile.auditionRequirement === 'POSITION'
          ? formatMessage({ defaultMessage: 'Une audition est à prévoir pour ce poste' })
          : formatMessage({ defaultMessage: 'Une audition a été demandée' }),
      );
    if (reportersAnnounced)
      announcements.push(formatMessage({ defaultMessage: '2 rapporteurs sont attendus pour ce poste' }));

    return announcements;
  }

  return { auditionAnnounced: !isSg && auditionMissing, auditionMissing, labels: labels(), reportersMissing };
}
