import { useIntl } from 'react-intl';

import { memberFullName } from '@/utils/user.utils';
import type { SessionNominationFile } from '@queries/nomination-sessions.queries';

/**
 * the warning on each reporter's tag: the excluded jurisdictions, and the proposed magistrat when the
 * reporter in place excluded them since, which the API serves to the secretariat only
 */
export function useReporterWarnings(
  file: SessionNominationFile,
  jurisdictionTitles: ReadonlyMap<string, string>,
): ReadonlyMap<string, string> {
  const { formatMessage } = useIntl();
  const warnings = new Map(jurisdictionTitles);

  for (const { id } of file.reporterWarnings) {
    const reporter = file.reporters.find((candidate) => candidate.id === id);
    if (!reporter) continue;

    const title = formatMessage(
      { defaultMessage: '{memberName} a exclu le magistrat proposé' },
      { memberName: memberFullName(reporter) },
    );
    const jurisdictions = warnings.get(id);
    warnings.set(id, jurisdictions ? `${jurisdictions}. ${title}` : title);
  }

  return warnings;
}
