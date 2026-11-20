import {
  type Impersonation,
  personalContentVisibility,
  type PersonalContentVisibility,
} from '../../shared/policies/personal-content.policies';
import { isSecretariat, type RoleEnum } from '../../shared/role.enum';

export const ReportLockEnum = {
  CLOSED_SESSION: 'CLOSED_SESSION',
  IMPERSONATION: 'IMPERSONATION',
} as const;
export type ReportLockEnum = (typeof ReportLockEnum)[keyof typeof ReportLockEnum];

/** a report is the work of its reporter: the admin impersonating them reads it without changing it */
export function reportLock(
  session: { isOpen: boolean },
  user: { impersonation: Impersonation | undefined },
): ReportLockEnum | null {
  if (!session.isOpen) return 'CLOSED_SESSION';
  if (personalContentVisibility(user) === 'PRIVATE') return 'IMPERSONATION';

  return null;
}

/** null for the secretariat, who reads the report but not its attachments */
export function reportAttachmentsVisibility(user: {
  impersonation: Impersonation | undefined;
  role: RoleEnum;
}): PersonalContentVisibility | null {
  return isSecretariat(user.role) ? null : personalContentVisibility(user);
}
