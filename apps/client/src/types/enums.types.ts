import type {
  AffectReportersDto,
  DetailedNominationSessionDto,
  DetailedReportDto,
  DetailedUserResponseDto
} from '@api/types';

export type RoleEnum = DetailedUserResponseDto['role'];
export const RoleEnumLabels: Record<RoleEnum, string> = {
  MEMBRE_DU_SIEGE: 'Membre du siège',
  MEMBRE_DU_PARQUET: 'Membre du parquet',
  MEMBRE_COMMUN: 'Membre commun',
  ADJOINT_SECRETAIRE_GENERAL: 'Secrétariat général'
};

export type GenderEnum = DetailedUserResponseDto['gender'];
export type GradeEnum = NonNullable<DetailedReportDto['grade']>;
export type ReportStatusEnum = NonNullable<DetailedReportDto['state']>;
// TODO: remove?
export type ReportFileUsageEnum = NonNullable<
  DetailedReportDto['attachments'][number]['usage'] | DetailedReportDto['screenshots'][number]['usage']
>;

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

export type PrioriteEnum = NonNullable<AffectReportersDto['items'][number]['priority']>;
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
