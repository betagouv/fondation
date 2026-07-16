import { PrioriteEnum } from 'shared-models';

import { DocNominationFileOutcomeEnum } from 'src/modules/docs/domain/doc-nomination-file-outcome';
import { GradeEnum } from 'src/modules/shared/grade.enum';
import { DateOnly } from 'src/utils/date-only';
import { isDefined } from 'src/utils/is-defined';
import { toParisWallClock } from 'src/utils/paris-wall-clock';

import { NominationFileOutcome, NominationFileOutcomeEnum } from './nomination-file-outcome';

type InternalNominationFile = {
  fileNumber: number;
  name: string;
  rank: string | null;
  grade: GradeEnum;
  targetedGrade: GradeEnum;
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
  priorities: PrioriteEnum[];
  sortableTargetedGrade: number;
  detectedMagistratId: string | null;
  detectedJurisdictionId: string | null;
  detectedTargetedFunctionId: string | null;
  detectedTargetedPositionId: number | null;
};

export type LolfiNominationFile = NominationFile & { externalId: number };

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
  scheduledAuditionAt: Date | null;
};

export class AuditionAlreadyOccurred extends Error {
  constructor() {
    super("L'audition a déjà eu lieu et ne peut plus être modifiée");
  }
}

// FIXME: improve naming
export class UpdatableNominationFile {
  private static readonly FINAL_OUTCOMES = new Set<NominationFileOutcomeEnum>(
    NominationFileOutcome.finalOutcomes(),
  );

  constructor(
    readonly id: string,
    private readonly outcome: NominationFileOutcomeEnum | null,
    private readonly docs: readonly UpdatableNominationFileDoc[],
    private readonly scheduledAuditionAt: Date | null,
  ) {}

  static from(props: UpdatableNominationFileState): UpdatableNominationFile {
    return new UpdatableNominationFile(props.id, props.outcome, props.docs, props.scheduledAuditionAt);
  }

  isUpdatable(): boolean {
    const canUpdateNominationFile =
      this.isOutcomeIgnored() || !this.isLinkedToOfficialReportWithFinalOutcome();

    return canUpdateNominationFile;
  }

  assertAllowsAudition(): void {
    NominationFileOutcome.assertAllowsAudition(this.outcome);
  }

  assertAuditionIsEditable(now: Date): void {
    if (
      this.scheduledAuditionAt !== null &&
      this.scheduledAuditionAt.getTime() < toParisWallClock(now).getTime()
    ) {
      throw new AuditionAlreadyOccurred();
    }
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
