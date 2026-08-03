import { createContext, useContext } from 'react';
import { useIntl } from 'react-intl';

import {
  jurisdictionsByMember,
  MemberExcludedJurisdictions,
  type ExcludedJurisdictionConflict,
} from './member-excluded-jurisdictions';

/** @internal */
export const ExcludedJurisdictionsContext = createContext(null as unknown as MemberExcludedJurisdictions);

export function useExcludedJurisdictions(): MemberExcludedJurisdictions {
  const ctx = useContext(ExcludedJurisdictionsContext);
  if (!ctx) throw new Error(`unknown context "ExcludedJurisdictionsContext"`);

  return ctx;
}

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
