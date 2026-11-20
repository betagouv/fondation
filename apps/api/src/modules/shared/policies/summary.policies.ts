import { isSecretariat, type RoleEnum } from '../role.enum';

import {
  type Impersonation,
  personalContentVisibility,
  type PersonalContentVisibility,
} from './personal-content.policies';

type SummaryUser = { id: string; impersonation: Impersonation | undefined; role: RoleEnum };

export function canReadSummary(
  summary: { authorId: string | null; readerIds: readonly string[] },
  user: SummaryUser,
): boolean {
  return canWriteSummary(summary, user) || summaryVisibility(summary, user) === 'VISIBLE';
}

export function summaryVisibility(
  summary: { readerIds: readonly string[] },
  user: SummaryUser,
): PersonalContentVisibility | null {
  return summary.readerIds.includes(user.id) ? personalContentVisibility(user) : null;
}

/** until someone writes it, a summary has no author and any secretariat member may take it */
export function canWriteSummary(
  summary: { authorId: string | null },
  user: { id: string; role: RoleEnum },
): boolean {
  return summary.authorId ? summary.authorId === user.id : isSecretariat(user.role);
}
