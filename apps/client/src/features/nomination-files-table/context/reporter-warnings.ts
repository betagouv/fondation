import { useIntl } from 'react-intl';

import { nonAffectableReasonOn } from '../components/cells/magistrat-side-panel/components/recused-members/recused-reporters';
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

  for (const reporter of file.reporters) {
    if (nonAffectableReasonOn(file, reporter.id) !== 'EXCLUDED_MAGISTRAT') continue;

    const title = formatMessage(
      { defaultMessage: '{memberName} a exclu le magistrat proposé' },
      { memberName: memberFullName(reporter) },
    );
    const jurisdictions = warnings.get(reporter.id);
    warnings.set(reporter.id, jurisdictions ? `${jurisdictions}. ${title}` : title);
  }

  return warnings;
}
