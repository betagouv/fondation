// oxlint-disable-next-line sort-keys -- the user registration CLI offers the roles in this order
export const RoleEnum = {
  MEMBRE_DU_SIEGE: 'MEMBRE_DU_SIEGE',
  MEMBRE_DU_PARQUET: 'MEMBRE_DU_PARQUET',
  MEMBRE_COMMUN: 'MEMBRE_COMMUN',
  ADJOINT_SECRETAIRE_GENERAL: 'ADJOINT_SECRETAIRE_GENERAL',
} as const;
export type RoleEnum = (typeof RoleEnum)[keyof typeof RoleEnum];

export const MEMBER_ROLES = [
  'MEMBRE_COMMUN',
  'MEMBRE_DU_PARQUET',
  'MEMBRE_DU_SIEGE',
] as const satisfies RoleEnum[];

export function isSecretariat(role: RoleEnum): boolean {
  return role === 'ADJOINT_SECRETAIRE_GENERAL';
}
