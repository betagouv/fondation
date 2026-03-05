import type {
  AffectReportersDto,
  DetailedNominationSessionDto,
  DetailedReportDto,
  DetailedUserResponseDto,
  FollowUpOnObservationDto,
  PaginatedNominationFiles
} from '@api/types';

export type RoleEnum = DetailedUserResponseDto['role'];
export const RoleEnumLabels: Record<RoleEnum, string> = {
  MEMBRE_DU_SIEGE: 'Membre du siège',
  MEMBRE_DU_PARQUET: 'Membre du parquet',
  MEMBRE_COMMUN: 'Membre commun',
  ADJOINT_SECRETAIRE_GENERAL: 'Secrétariat général'
};

export type GenderEnum = DetailedUserResponseDto['gender'];
export type ReportStatusEnum = NonNullable<DetailedReportDto['state']>;
// TODO: remove?
export type ReportFileUsageEnum = NonNullable<
  DetailedReportDto['attachments'][number]['usage'] | DetailedReportDto['screenshots'][number]['usage']
>;

export type GradeEnum = NonNullable<DetailedReportDto['grade']>;
export const GradeEnum: Record<GradeEnum, GradeEnum> = {
  I: 'I',
  II: 'II',
  III: 'III',
  HH: 'HH',
  G1: 'G1',
  G2: 'G2',
  G3: 'G3',
  G3sup: 'G3sup'
};

export type FormationEnum = NonNullable<DetailedReportDto['formation']>;
export const FormationEnum: Record<FormationEnum, FormationEnum> = {
  PARQUET: 'PARQUET',
  SIEGE: 'SIEGE'
};

export type TypeDeSaisineEnum = NonNullable<DetailedNominationSessionDto['typeDeSaisine']>;
export const TypeDeSaisineEnum = {
  TRANSPARENCE_GDS: 'TRANSPARENCE_GDS'
} satisfies Record<TypeDeSaisineEnum, TypeDeSaisineEnum>;

export const TypeDeSaisineEnumLabels: Record<TypeDeSaisineEnum, string> = {
  TRANSPARENCE_GDS: 'Transparence'
};

export type PrioriteEnum = NonNullable<AffectReportersDto['items'][number]['priorities']>[number];
export const PrioriteEnum = {
  ETOILE: 'ETOILE',
  OUTRE_MER: 'OUTRE_MER',
  PROFILE: 'PROFILE'
} satisfies Record<PrioriteEnum, PrioriteEnum>;

export const PrioriteEnumLabels: Record<PrioriteEnum, string> = {
  ETOILE: 'Étoilé',
  OUTRE_MER: 'Outre-mer',
  PROFILE: 'Profilé'
};

export type NominationFileOutcomeEnum = NonNullable<
  PaginatedNominationFiles['items'][number]['content']['outcome']
>['value'];

const NOMINATION_FILE_OUTCOME_LABELS = {
  PARQUET: {
    VALIDATED: 'avis favorable',
    NON_VALIDATED: 'avis défavorable',
    SUSPENDED: 'sursis à statuer',
    REMOVED: 'retrait',
    WITHDRAWN: 'retrait (désistement)',
    ASSESSING: 'en attente évaluation',
    WAITING_DSJ: 'en attente complément DSJ'
  },
  SIEGE: {
    VALIDATED: 'avis conforme',
    NON_VALIDATED: 'avis non conforme',
    SUSPENDED: 'sursis à statuer',
    REMOVED: 'retrait',
    WITHDRAWN: 'retrait (désistement)',
    ASSESSING: 'en attente évaluation',
    WAITING_DSJ: 'en attente complément DSJ'
  }
} as const satisfies Record<FormationEnum, Record<NominationFileOutcomeEnum, string>>;

const NOMINATION_FILE_OUTCOME_BADGE_LABELS = {
  PARQUET: {
    VALIDATED: 'favorable',
    NON_VALIDATED: 'défavorable',
    SUSPENDED: 'sursis',
    REMOVED: 'retrait',
    WITHDRAWN: 'désistement',
    ASSESSING: 'évaluation',
    WAITING_DSJ: 'complément DSJ'
  },
  SIEGE: {
    VALIDATED: 'conforme',
    NON_VALIDATED: 'non conforme',
    SUSPENDED: 'sursis',
    REMOVED: 'retrait',
    WITHDRAWN: 'désistement',
    ASSESSING: 'évaluation',
    WAITING_DSJ: 'complément DSJ'
  }
} as const satisfies Record<FormationEnum, Record<NominationFileOutcomeEnum, string>>;

const NOMINATION_FILE_OUTCOME_ACRONYM = {
  PARQUET: {
    VALIDATED: 'AF',
    NON_VALIDATED: 'AD',
    SUSPENDED: 'SAS',
    REMOVED: 'R',
    WITHDRAWN: 'RD',
    ASSESSING: 'EVL',
    WAITING_DSJ: 'DSJ'
  },
  SIEGE: {
    VALIDATED: 'AC',
    NON_VALIDATED: 'ANC',
    SUSPENDED: 'SAS',
    REMOVED: 'R',
    WITHDRAWN: 'RD',
    ASSESSING: 'EVL',
    WAITING_DSJ: 'DSJ'
  }
} as const satisfies Record<FormationEnum, Record<NominationFileOutcomeEnum, string>>;

export function outcomeLabels(outcome: { formation: FormationEnum; value: NominationFileOutcomeEnum }): {
  label: string;
  badge: string;
  acronym: string;
} {
  return {
    label: NOMINATION_FILE_OUTCOME_LABELS[outcome.formation][outcome.value],
    acronym: NOMINATION_FILE_OUTCOME_ACRONYM[outcome.formation][outcome.value],
    badge: NOMINATION_FILE_OUTCOME_BADGE_LABELS[outcome.formation][outcome.value]
  };
}

export type ObservationFollowupEnum = NonNullable<FollowUpOnObservationDto['followUp']>;
export const ObservationFollowUpEnum = {
  ALERT: 'ALERT',
  INTERESTING: 'INTERESTING',
  REFERENCE: 'REFERENCE'
} as const satisfies Record<ObservationFollowupEnum, ObservationFollowupEnum>;

export const ObservationFollowUpEnumLabels = {
  ALERT: 'Signalement',
  REFERENCE: 'Recommandation',
  INTERESTING: `Digne d'intérêt`
} as const satisfies Record<ObservationFollowupEnum, string>;
