import { useIntl } from 'react-intl';

import {
  jurisdictionsByMember,
  type ExcludedJurisdictionConflict,
} from '../context/member-excluded-jurisdictions';

export function useExcludedJurisdictionTitles(
  conflicts: readonly ExcludedJurisdictionConflict[],
): ReadonlyMap<string, string> {
  const { formatList, formatMessage } = useIntl();
  const titles = new Map<string, string>();

  for (const [memberId, { jurisdictions, memberName }] of jurisdictionsByMember(conflicts)) {
    titles.set(
      memberId,
      formatMessage(
        {
          defaultMessage:
            '{count, plural, one {Juridiction exclue} other {Juridictions exclues}} pour {memberName} : {jurisdictions}',
        },
        { count: jurisdictions.length, jurisdictions: formatList(jurisdictions), memberName },
      ),
    );
  }

  return titles;
}
