import { NominationFileLockEnum } from '../nomination-file-lock.enum';
import { NominationFileOutcome, NominationFileOutcomeEnum } from '../nomination-file-outcome.enum';
import { isSecretariat, type RoleEnum } from '../role.enum';

export function nominationFileLock(
  file: { isReported: boolean },
  session: { archivedAt: Date | null | undefined },
): NominationFileLockEnum | null {
  if (session.archivedAt) return 'ARCHIVED_SESSION';
  if (file.isReported) return 'REPORTED';

  return null;
}

export function canScheduleAudition(
  file: { outcome: NominationFileOutcomeEnum | null },
  session: { archivedAt: Date | null | undefined },
): boolean {
  return !session.archivedAt && NominationFileOutcome.allowsAudition(file.outcome);
}

export function canKeepMemberMemo(
  file: { reporterIds: readonly string[] },
  user: { id: string; role: RoleEnum },
): boolean {
  return !isSecretariat(user.role) && !file.reporterIds.includes(user.id);
}
