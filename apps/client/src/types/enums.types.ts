import type {
  AffectReportersDto,
  DetailedJobDto,
  DetailedNominationSessionDto,
  DetailedReportDto,
  DetailedUserResponseDto,
  FollowUpOnObservationDto,
  FoundDocsNominationFiles,
  PaginatedNominationFiles,
} from '@api/types';

export type RoleEnum = DetailedUserResponseDto['role'];
export const RoleEnumLabels: Record<RoleEnum, string> = {
  MEMBRE_DU_SIEGE: 'Membre du siège',
  MEMBRE_DU_PARQUET: 'Membre du parquet',
  MEMBRE_COMMUN: 'Membre commun',
  ADJOINT_SECRETAIRE_GENERAL: 'Secrétariat général',
  ADMIN: 'Administrateur',
};

export type GenderEnum = DetailedUserResponseDto['gender'];
export type ReportStatusEnum = NonNullable<DetailedReportDto['state']>;
export const REPORT_STATUSES = [
  'NEW',
  'IN_PROGRESS',
  'READY_TO_SUPPORT',
  'SUPPORTED',
] as const satisfies ReportStatusEnum[];

export const REPORT_STATUS_ENUM_LABEL = {
  NEW: 'Nouveau',
  IN_PROGRESS: 'En cours',
  READY_TO_SUPPORT: 'Prêt à soutenir',
  SUPPORTED: 'Soutenu',
} as const satisfies Record<ReportStatusEnum, string>;

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
  G3sup: 'G3sup',
};

export type FormationEnum = NonNullable<DetailedReportDto['formation']>;
export const FormationEnum: Record<FormationEnum, FormationEnum> = {
  PARQUET: 'PARQUET',
  SIEGE: 'SIEGE',
};

export const FormationEnumLabel = {
  PARQUET: 'parquet',
  SIEGE: 'siège',
} as const satisfies Record<FormationEnum, string>;

export type TypeDeSaisineEnum = NonNullable<DetailedNominationSessionDto['typeDeSaisine']>;
export const TypeDeSaisineEnum = {
  TRANSPARENCE_GDS: 'TRANSPARENCE_GDS',
} satisfies Record<TypeDeSaisineEnum, TypeDeSaisineEnum>;

export const TypeDeSaisineEnumLabels: Record<TypeDeSaisineEnum, string> = {
  TRANSPARENCE_GDS: 'Transparence',
};

export type PrioriteEnum = NonNullable<AffectReportersDto['items'][number]['priorities']>[number];
export const PrioriteEnum = {
  ETOILE: 'ETOILE',
  OUTRE_MER: 'OUTRE_MER',
  PROFILE: 'PROFILE',
} satisfies Record<PrioriteEnum, PrioriteEnum>;

export const PrioriteEnumLabels: Record<PrioriteEnum, string> = {
  ETOILE: 'Étoilé',
  OUTRE_MER: 'Outre-mer',
  PROFILE: 'Profilé',
};

export type NominationFileOutcomeEnum = NonNullable<
  PaginatedNominationFiles['items'][number]['content']['outcome']
>['value'];

export const NominationFileOutcomeEnum = {
  VALIDATED: 'VALIDATED',
  NON_VALIDATED: 'NON_VALIDATED',
  SUSPENDED: 'SUSPENDED',
  REMOVED: 'REMOVED',
  WITHDRAWN: 'WITHDRAWN',
  ASSESSING: 'ASSESSING',
  WAITING_DSJ: 'WAITING_DSJ',
} as const satisfies Record<NominationFileOutcomeEnum, NominationFileOutcomeEnum>;

export type ObservationFollowupEnum = NonNullable<FollowUpOnObservationDto['followUp']>;
export const ObservationFollowUpEnum = {
  ALERT: 'ALERT',
  INTERESTING: 'INTERESTING',
  REFERENCE: 'REFERENCE',
} as const satisfies Record<ObservationFollowupEnum, ObservationFollowupEnum>;

export const ObservationFollowUpEnumLabels = {
  ALERT: 'Signalement',
  INTERESTING: `Digne d'intérêt`,
  REFERENCE: 'Recommandation',
} as const satisfies Record<ObservationFollowupEnum, string>;

export type JobStatusEnum = DetailedJobDto['status'];
export const JobStatusEnum = {
  CANCELED: 'CANCELED',
  FAILED: 'FAILED',
  IDLE: 'IDLE',
  RUNNING: 'RUNNING',
  SUCCEEDED: 'SUCCEEDED',
} as const satisfies Record<JobStatusEnum, JobStatusEnum>;

export const JobStatusEnumLabel: Record<JobStatusEnum, string> = {
  CANCELED: 'annulé',
  FAILED: 'échec',
  IDLE: 'en attente',
  RUNNING: 'en cours',
  SUCCEEDED: 'succès',
};

export type NominationSessionFileStatus = PaginatedNominationFiles['items'][number]['content']['status'];

export type DocNominationFileOutcomeEnum = NonNullable<
  FoundDocsNominationFiles['items'][number]['outcome']
>['value'];
