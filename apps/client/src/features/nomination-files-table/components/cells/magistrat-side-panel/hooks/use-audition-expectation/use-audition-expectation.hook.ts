import { useIntl } from 'react-intl';

import { useIsSgNavigation } from '@/features/auth/hooks/roles.hook';
import { areReportersMissing, isAuditionMissing } from '@/utils/audition-expectation.util';
import type { SessionNominationFile } from '@queries/nomination-sessions.queries';

export type AuditionExpectation = {
  auditionMissing: boolean;
  label: string | null;
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
    nominationFile,
    options.selectedReportersCount ?? nominationFile.reporters.length,
  );
  const reportersAnnounced = isSg && reportersMissing;

  function label() {
    if (auditionMissing && reportersAnnounced)
      return formatMessage({
        defaultMessage: 'Une audition est à prévoir et 2 rapporteurs sont attendus pour ce poste',
      });
    if (auditionMissing) return formatMessage({ defaultMessage: 'Une audition est à prévoir pour ce poste' });
    if (reportersAnnounced)
      return formatMessage({ defaultMessage: '2 rapporteurs sont attendus pour ce poste' });

    return null;
  }

  return { auditionMissing, label: label(), reportersMissing };
}
