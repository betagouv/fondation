import { DocNominationFileOutcomeEnum } from 'src/modules/docs/shared/domain/doc-nomination-file-outcome';
import { isDefined } from 'src/utils/is-defined';

export const NOMINATION_SESSION_FILE_STATUSES = ['TO_REPORT', 'DSJ_PLANNED', 'DSJ_REPORTED'] as const;

export type NominationSessionFileStatusEnum = (typeof NOMINATION_SESSION_FILE_STATUSES)[number];

export function transparenceFileStatus(file: {
  id: string;
  docs: readonly {
    agenda: { id: string; outcome: DocNominationFileOutcomeEnum | null };
    officialReport: { id: string; outcome: DocNominationFileOutcomeEnum } | null;
  }[];
}): NominationSessionFileStatusEnum {
  const hasMissingOfficialReport = file.docs.some((doc) => !isDefined(doc.officialReport));
  if (hasMissingOfficialReport) return 'DSJ_PLANNED';

  const hasNoMissingOfficialReport =
    file.docs.length > 0 && file.docs.every((doc) => isDefined(doc.officialReport));
  if (hasNoMissingOfficialReport) return 'DSJ_REPORTED';

  return 'TO_REPORT';
}
