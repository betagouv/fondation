import {
  DocNominationFileOutcomeEnum,
  nominationFileOutcomeToDocNominationFileOutcome,
} from 'src/modules/docs/shared/domain/doc-nomination-file-outcome';
import { NominationFileOutcomeEnum } from 'src/modules/shared/nomination-file-outcome.enum';
import { isDefined } from 'src/utils/is-defined';

export const NOMINATION_SESSION_FILE_STATUSES = ['TO_REPORT', 'DSJ_PLANNED', 'DSJ_REPORTED'] as const;

export type NominationSessionFileStatusEnum = (typeof NOMINATION_SESSION_FILE_STATUSES)[number];

export type NominationSessionFileStatus = {
  value: NominationSessionFileStatusEnum;
  dates: Date[];
};

type LinkedDoc = {
  agenda: { id: string; outcome: DocNominationFileOutcomeEnum | null; sessionMeetingDate: Date };
  officialReport: {
    id: string;
    isValidated: boolean;
    outcome: DocNominationFileOutcomeEnum;
    sessionMeetingDate: Date;
  } | null;
};

export function transparenceFileStatus(file: {
  docs: readonly LinkedDoc[];
  outcome: NominationFileOutcomeEnum | null;
}): NominationSessionFileStatus {
  const reported = file.docs.flatMap((doc) =>
    isDefined(doc.officialReport) &&
    doc.officialReport.isValidated &&
    restitutes(doc.officialReport, file.outcome)
      ? [doc.officialReport.sessionMeetingDate]
      : [],
  );
  if (reported.length > 0) return { value: 'DSJ_REPORTED', dates: mostRecentFirst(reported) };

  const planned = file.docs.flatMap((doc) =>
    doc.officialReport?.isValidated ? [] : [doc.agenda.sessionMeetingDate],
  );
  if (planned.length > 0) return { value: 'DSJ_PLANNED', dates: mostRecentFirst(planned) };

  return { value: 'TO_REPORT', dates: [] };
}

function restitutes(
  officialReport: { outcome: DocNominationFileOutcomeEnum },
  outcome: NominationFileOutcomeEnum | null,
): boolean {
  return (
    isDefined(outcome) && officialReport.outcome === nominationFileOutcomeToDocNominationFileOutcome(outcome)
  );
}

function mostRecentFirst(dates: readonly Date[]): Date[] {
  const byTime = new Map(dates.map((date) => [date.getTime(), date]));
  return [...byTime.values()].sort((a, b) => b.getTime() - a.getTime());
}
