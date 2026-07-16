export const RoleEnum = {
  MEMBRE_DU_SIEGE: 'MEMBRE_DU_SIEGE',
  MEMBRE_DU_PARQUET: 'MEMBRE_DU_PARQUET',
  MEMBRE_COMMUN: 'MEMBRE_COMMUN',
  ADJOINT_SECRETAIRE_GENERAL: 'ADJOINT_SECRETAIRE_GENERAL',
  ADMIN: 'ADMIN',
} as const;
export type RoleEnum = (typeof RoleEnum)[keyof typeof RoleEnum];
