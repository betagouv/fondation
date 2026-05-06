import { Magistrat } from 'shared-models';

import { DateOnly } from 'src/utils/date-only';

import { NominationFileOutcomeEnum } from './nomination-file-outcome';

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

export type UpdatableNominationFileState = {
  id: string;
  outcome: NominationFileOutcomeEnum | null;
  docs: {
    isLinkedToAgenda: boolean;
    isLinkedToOfficialReport: boolean;
    isLinkedToPresentationPlan: boolean;
  };
};

// FIXME: improve naming
export class UpdatableNominationFile {
  private static readonly IGNORED_OUTCOMES = [
    null,
    'SUSPENDED',
    'WAITING_DSJ',
    'ASSESSING',
  ] satisfies (NominationFileOutcomeEnum | null)[];

  constructor(
    readonly id: string,
    private readonly outcome: NominationFileOutcomeEnum | null,
    private readonly docs: {
      isLinkedToAgenda: boolean;
      isLinkedToOfficialReport: boolean;
      isLinkedToPresentationPlan: boolean;
    },
  ) {}

  static from(props: UpdatableNominationFileState) {
    return new UpdatableNominationFile(props.id, props.outcome, props.docs);
  }

  isUpdatable(): boolean {
    const isLinkedToAnyDocument =
      this.docs.isLinkedToAgenda ||
      this.docs.isLinkedToOfficialReport ||
      this.docs.isLinkedToPresentationPlan;

    const canUpdateNominationFile = this.isOutcomeIgnored || !isLinkedToAnyDocument;

    return canUpdateNominationFile;
  }

  status(): NominationSessionFileStatusEnum {
    if (this.isOutcomeIgnored) return 'TO_REPORT';

    if (this.docs.isLinkedToOfficialReport) return 'DSJ_REPORTED';
    if (this.docs.isLinkedToPresentationPlan || this.docs.isLinkedToAgenda) {
      return 'DSJ_PLANNED';
    }

    return 'TO_REPORT';
  }

  private get isOutcomeIgnored(): boolean {
    return UpdatableNominationFile.IGNORED_OUTCOMES.includes(this.outcome as any);
  }
}
