import type { GenderEnum } from './gender.enum';

export const ADMIN_USER_ROLES_ENUM = [
  'FIRST_SECRETARY',
  'SECRETARY',
  'OFFICER',

  'PRESIDENT_SIEGE',
  'DEPUTY_PRESIDENT_SIEGE',
  'PRESIDENT_PARQUET',
  'DEPUTY_PRESIDENT_PARQUET',

  'MEMBRE_PARQUET',
  'MEMBRE_SIEGE',
  'MEMBRE_COMMUN',
] as const;
export type AdminUserRoleEnum = (typeof ADMIN_USER_ROLES_ENUM)[number];

/** the wording of the official documents, agreed with the CSM on 2026-10-28 */
const ADMIN_USER_ROLE_LABELS = {
  DEPUTY_PRESIDENT_PARQUET: {
    FEMALE: 'Présidente suppléante de la formation du parquet',
    MALE: 'Président suppléant de la formation du parquet',
    neutral: 'Président(e) suppléant(e) de la formation du parquet',
  },
  DEPUTY_PRESIDENT_SIEGE: {
    FEMALE: 'Présidente suppléante de la formation du siège',
    MALE: 'Président suppléant de la formation du siège',
    neutral: 'Président(e) suppléant(e) de la formation du siège',
  },
  FIRST_SECRETARY: {
    FEMALE: 'Secrétaire générale',
    MALE: 'Secrétaire général',
    neutral: 'Secrétaire général(e)',
  },
  MEMBRE_COMMUN: { FEMALE: 'Membre commun', MALE: 'Membre commun', neutral: 'Membre commun' },
  MEMBRE_PARQUET: { FEMALE: 'Membre du Parquet', MALE: 'Membre du Parquet', neutral: 'Membre du Parquet' },
  MEMBRE_SIEGE: { FEMALE: 'Membre du Siège', MALE: 'Membre du Siège', neutral: 'Membre du Siège' },
  OFFICER: {
    FEMALE: 'Agente du pôle nomination',
    MALE: 'Agent du pôle nomination',
    neutral: 'Agent(e) du pôle nomination',
  },
  PRESIDENT_PARQUET: {
    FEMALE: 'Présidente de la formation du parquet',
    MALE: 'Président de la formation du parquet',
    neutral: 'Président(e) de la formation du parquet',
  },
  PRESIDENT_SIEGE: {
    FEMALE: 'Présidente de la formation du siège',
    MALE: 'Président de la formation du siège',
    neutral: 'Président(e) de la formation du siège',
  },
  SECRETARY: {
    FEMALE: 'Secrétaire générale adjointe',
    MALE: 'Secrétaire général adjoint',
    neutral: 'Secrétaire général(e) adjoint(e)',
  },
} as const satisfies Record<AdminUserRoleEnum, Record<GenderEnum | 'neutral', string>>;

/** @param gender undefined gives the neutral form, for a list that covers every account */
export function adminUserRoleLabel(role: AdminUserRoleEnum, gender: GenderEnum | undefined): string {
  return ADMIN_USER_ROLE_LABELS[role][gender ?? 'neutral'];
}
