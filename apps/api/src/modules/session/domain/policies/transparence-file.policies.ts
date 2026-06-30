import { TransparenceFileDocsSnapshot } from '../nomination-file';
import { NominationFileOutcome, NominationFileOutcomeEnum } from '../nomination-file-outcome';
import { isDefined } from 'src/utils/is-defined';

const FINAL_OUTCOMES = new Set<NominationFileOutcomeEnum>(NominationFileOutcome.finalOutcomes());
export function canUpdateTransparenceFile(
  file: TransparenceFileDocsSnapshot,
  session: { archivedAt: Date | null | undefined },
): boolean {
  const isOutcomeIgnored = file.outcome === null || !FINAL_OUTCOMES.has(file.outcome);

  const isLinkedToOfficialReportWithFinalOutcome = file.docs.some(
    (doc) => isDefined(doc.officialReport) && FINAL_OUTCOMES.has(doc.officialReport.outcome),
  );

  return !session.archivedAt && (isOutcomeIgnored || !isLinkedToOfficialReportWithFinalOutcome);
}

const NON_FINAL_OUTCOMES = new Set<NominationFileOutcomeEnum>(NominationFileOutcome.nonFinalOutcomes());
export function canScheduleAudition(
  file: { outcome: NominationFileOutcomeEnum | null },
  session: { archivedAt: Date | null | undefined },
): boolean {
  return !session.archivedAt && (file.outcome === null || NON_FINAL_OUTCOMES.has(file.outcome));
}
