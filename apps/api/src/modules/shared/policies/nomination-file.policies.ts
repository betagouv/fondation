import { NominationFileLockEnum } from '../nomination-file-lock.enum';
import { NominationFileOutcome, NominationFileOutcomeEnum } from '../nomination-file-outcome.enum';
import { isSecretariat, type RoleEnum } from '../role.enum';

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

export function canKeepMemberMemo(
  file: { reporterIds: readonly string[] },
  user: { id: string; role: RoleEnum },
): boolean {
  return !isSecretariat(user.role) && !file.reporterIds.includes(user.id);
}
