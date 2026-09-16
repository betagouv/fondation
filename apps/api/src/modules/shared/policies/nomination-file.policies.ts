import { NominationFileOutcome, NominationFileOutcomeEnum } from '../nomination-file-outcome.enum';
import { NominationFileLockEnum } from 'src/modules/shared/nomination-file-lock.enum';

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
