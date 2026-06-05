import { Magistrat } from 'shared-models';

import { DocNominationFileOutcomeEnum } from 'src/modules/docs/domain/doc-nomination-file-outcome';
import { DateOnly } from 'src/utils/date-only';
import { isDefined } from 'src/utils/is-defined';

import { NominationFileOutcome, NominationFileOutcomeEnum } from './nomination-file-outcome';

type InternalNominationFile = {
  fileNumber: number;
  name: string;
  rank: string | null;
  grade: Magistrat.Grade;
  targetedGrade: Magistrat.Grade;
  targetedPosition: string;
  birthDate: DateOnly | null;
  currentPosition: string;
  lastPositionDate: DateOnly | null;
  lastRankingDate: DateOnly | null;
  biography: string | null;
  careerInformation: string | null;
};

export type LodamNominationFile = InternalNominationFile & {
  observers: string[];
  reporters: string[];
};

export type LodamNominationFileEntity = LodamNominationFile & { id: string };

export type NominationFile = InternalNominationFile & {
  sortableTargetedGrade: number;
  detectedMagistratId: string | null;
  detectedJurisdictionId: string | null;
  detectedTargetedFunctionId: string | null;
  detectedTargetedPositionId: number | null;
};

export type NominationFileEntity = NominationFile & { id: string };

export const NOMINATION_SESSION_FILE_STATUSES = ['TO_REPORT', 'DSJ_PLANNED', 'DSJ_REPORTED'] as const;

export type NominationSessionFileStatusEnum = (typeof NOMINATION_SESSION_FILE_STATUSES)[number];

type UpdatableNominationFileDoc = {
  agenda: { id: string; outcome: DocNominationFileOutcomeEnum | null };
  officialReport: { id: string; outcome: DocNominationFileOutcomeEnum } | null;
};

export type UpdatableNominationFileState = {
  id: string;
  outcome: NominationFileOutcomeEnum | null;
  docs: readonly UpdatableNominationFileDoc[];
};

// FIXME: improve naming
export class UpdatableNominationFile {
  private static readonly FINAL_OUTCOMES = new Set<NominationFileOutcomeEnum>(
    NominationFileOutcome.finalOutcomes(),
  );

  constructor(
    readonly id: string,
    private readonly outcome: NominationFileOutcomeEnum | null,
    private readonly docs: readonly UpdatableNominationFileDoc[],
  ) {}

  static from(props: UpdatableNominationFileState): UpdatableNominationFile {
    return new UpdatableNominationFile(props.id, props.outcome, props.docs);
  }

  isUpdatable(): boolean {
    const canUpdateNominationFile =
      this.isOutcomeIgnored() || !this.isLinkedToOfficialReportWithFinalOutcome();

    return canUpdateNominationFile;
  }

  status(): NominationSessionFileStatusEnum {
    const hasMissingOfficialReport = this.docs.some((doc) => !isDefined(doc.officialReport));
    if (hasMissingOfficialReport) return 'DSJ_PLANNED';

    const hasNoMissingOfficialReport =
      this.docs.length > 0 && this.docs.every((doc) => isDefined(doc.officialReport));
    if (hasNoMissingOfficialReport) return 'DSJ_REPORTED';

    return 'TO_REPORT';
  }

  private isLinkedToOfficialReportWithFinalOutcome(): boolean {
    return this.docs.some(
      (doc) =>
        isDefined(doc.officialReport) &&
        UpdatableNominationFile.FINAL_OUTCOMES.has(doc.officialReport.outcome),
    );
  }

  private isOutcomeIgnored(): boolean {
    return this.outcome === null || !UpdatableNominationFile.FINAL_OUTCOMES.has(this.outcome);
  }
}
