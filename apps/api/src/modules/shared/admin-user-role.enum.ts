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
  MEMBRE_PARQUET: { FEMALE: 'Membre du parquet', MALE: 'Membre du parquet', neutral: 'Membre du parquet' },
  MEMBRE_SIEGE: { FEMALE: 'Membre du siège', MALE: 'Membre du siège', neutral: 'Membre du siège' },
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

/** the introduction of the official report names the chairman without the formation, asked by the CSM on 2026-10-30 */
const CHAIRMAN_ROLE_LABELS = {
  DEPUTY_PRESIDENT: {
    FEMALE: 'présidente suppléante de la formation',
    MALE: 'président suppléant de la formation',
  },
  PRESIDENT: { FEMALE: 'présidente de la formation', MALE: 'président de la formation' },
} as const satisfies Record<string, Record<GenderEnum, string>>;
export type ChairmanRole = keyof typeof CHAIRMAN_ROLE_LABELS;

export function chairmanRoleLabel(role: ChairmanRole, gender: GenderEnum): string {
  return CHAIRMAN_ROLE_LABELS[role][gender];
}

/** the signatures of the official report keep their article and drop the formation */
const SIGNATORY_ROLE_LABELS = {
  DEPUTY_PRESIDENT_PARQUET: { FEMALE: 'la présidente suppléante', MALE: 'le président suppléant' },
  DEPUTY_PRESIDENT_SIEGE: { FEMALE: 'la présidente suppléante', MALE: 'le président suppléant' },
  FIRST_SECRETARY: { FEMALE: 'la secrétaire générale', MALE: 'le secrétaire général' },
  PRESIDENT_PARQUET: { FEMALE: 'la présidente', MALE: 'le président' },
  PRESIDENT_SIEGE: { FEMALE: 'la présidente', MALE: 'le président' },
  SECRETARY: { FEMALE: 'la secrétaire générale adjointe', MALE: 'le secrétaire général adjoint' },
} as const satisfies Partial<Record<AdminUserRoleEnum, Record<GenderEnum, string>>>;
export type SignatoryRole = keyof typeof SIGNATORY_ROLE_LABELS;

export function signatoryRoleLabel(role: SignatoryRole, gender: GenderEnum): string {
  return SIGNATORY_ROLE_LABELS[role][gender];
}
