import type {
  AffectReportersDto,
  DetailedJobDto,
  DetailedNominationSessionDto,
  DetailedReportDto,
  DetailedUserResponseDto,
  FollowUpOnObservationDto,
  FoundAgendaNominationFiles,
  PaginatedNominationFiles,
  UploadNominationFileAttachmentsDto,
} from '@api/types';

export type RoleEnum = DetailedUserResponseDto['role'];

export type GenderEnum = DetailedUserResponseDto['gender'];
export type NominationFileAttachmentTypeEnum = UploadNominationFileAttachmentsDto['form']['type'];
export type ReportStatusEnum = NonNullable<DetailedReportDto['state']>;
export const REPORT_STATUSES = [
  'NEW',
  'IN_PROGRESS',
  'READY_TO_SUPPORT',
  'SUPPORTED',
] as const satisfies ReportStatusEnum[];

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

export type TypeDeSaisineEnum = NonNullable<DetailedNominationSessionDto['typeDeSaisine']>;
export const TypeDeSaisineEnum = {
  TRANSPARENCE_GDS: 'TRANSPARENCE_GDS',
} satisfies Record<TypeDeSaisineEnum, TypeDeSaisineEnum>;

export type PrioriteEnum = NonNullable<AffectReportersDto['items'][number]['priorities']>[number];
export const PrioriteEnum = {
  ETOILE: 'ETOILE',
  OUTRE_MER: 'OUTRE_MER',
  PROFILE: 'PROFILE',
} satisfies Record<PrioriteEnum, PrioriteEnum>;

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

export type JobStatusEnum = DetailedJobDto['status'];
export const JobStatusEnum = {
  CANCELED: 'CANCELED',
  FAILED: 'FAILED',
  IDLE: 'IDLE',
  RUNNING: 'RUNNING',
  SUCCEEDED: 'SUCCEEDED',
} as const satisfies Record<JobStatusEnum, JobStatusEnum>;

export type NominationSessionFileStatus = PaginatedNominationFiles['items'][number]['content']['status'];

export type DocNominationFileOutcomeEnum = NonNullable<
  FoundAgendaNominationFiles['items'][number]['outcome']
>['value'];
