import {
  DocNominationFileOutcomeEnum,
  nominationFileOutcomeToDocNominationFileOutcome,
} from 'src/modules/docs/shared/domain/doc-nomination-file-outcome';
import { NominationFileOutcomeEnum } from 'src/modules/session/shared/types/nomination-file-outcome';
import { isDefined } from 'src/utils/is-defined';

export const NOMINATION_SESSION_FILE_STATUSES = ['TO_REPORT', 'DSJ_PLANNED', 'DSJ_REPORTED'] as const;

export type NominationSessionFileStatusEnum = (typeof NOMINATION_SESSION_FILE_STATUSES)[number];

export type NominationSessionFileStatus = {
  value: NominationSessionFileStatusEnum;
  date: Date | null;
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
  const planned = file.docs.filter((doc) => !doc.officialReport?.isValidated);
  if (planned.length > 0) {
    return { value: 'DSJ_PLANNED', date: mostRecent(planned.map(({ agenda }) => agenda.sessionMeetingDate)) };
  }

  const reported = file.docs.flatMap((doc) =>
    isDefined(doc.officialReport) && restitutes(doc.officialReport, file.outcome)
      ? [doc.officialReport.sessionMeetingDate]
      : [],
  );
  if (reported.length > 0) return { value: 'DSJ_REPORTED', date: mostRecent(reported) };

  return { value: 'TO_REPORT', date: null };
}

function restitutes(
  officialReport: { outcome: DocNominationFileOutcomeEnum },
  outcome: NominationFileOutcomeEnum | null,
): boolean {
  return (
    isDefined(outcome) && officialReport.outcome === nominationFileOutcomeToDocNominationFileOutcome(outcome)
  );
}

function mostRecent(dates: readonly Date[]): Date | null {
  return dates.reduce<Date | null>((latest, date) => (!latest || date > latest ? date : latest), null);
}
