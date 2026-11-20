import type { Writer } from '../../../utils/user.util';
import { NominationFileLockEnum } from '../nomination-file-lock.enum';
import { NominationFileOutcome, NominationFileOutcomeEnum } from '../nomination-file-outcome.enum';
import { isSecretariat, type RoleEnum } from '../role.enum';

import {
  type Impersonation,
  personalContentVisibility,
  type PersonalContentVisibility,
} from './personal-content.policies';

export function nominationFileLock(
  file: { isReported: boolean },
  session: { isArchived: boolean },
): NominationFileLockEnum | null {
  if (session.isArchived) return 'ARCHIVED_SESSION';
  if (file.isReported) return 'REPORTED';

  return null;
}

export function canScheduleAudition(
  file: { outcome: NominationFileOutcomeEnum | null },
  session: { isArchived: boolean },
): boolean {
  return !session.isArchived && NominationFileOutcome.allowsAudition(file.outcome);
}

/** recusing members as adding, renaming or detaching attachments */
export function canUpdateNominationFile(
  file: { lockedReason: NominationFileLockEnum | null },
  user: { role: RoleEnum },
): boolean {
  return isSecretariat(user.role) && !file.lockedReason;
}

export function memberMemoVisibility(
  file: { reporterIds: readonly string[] },
  user: { id: string; impersonation: Impersonation | undefined; role: RoleEnum },
): PersonalContentVisibility | null {
  if (isSecretariat(user.role) || file.reporterIds.includes(user.id)) return null;

  return personalContentVisibility(user);
}

/** the members read the SG complement as the secretariat's: they see when it changed, not who changed it */
export function sgCommentChangeSeenBy(
  change: { at: string; by: Writer },
  user: { role: RoleEnum },
): { at: string; by: Writer } {
  return isSecretariat(user.role) ? change : { ...change, by: null };
}
