import { createContext, useContext } from 'react';

import { MemberReports } from './member-reports';

/** @internal */
export const MemberReportsContext = createContext(null as unknown as MemberReports);

export function useMemberReports(): MemberReports {
  const ctx = useContext(MemberReportsContext);
  if (!ctx) throw new Error(`unknown context "MemberReportsContext"`);

  return ctx;
}
