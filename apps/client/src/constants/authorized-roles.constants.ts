import type { RoleEnum } from '@/types/enums.types';

export const AUTHORIZED_ROLES = {
  NONE: [] satisfies RoleEnum[],
  MEMBER: ['MEMBRE_COMMUN', 'MEMBRE_DU_PARQUET', 'MEMBRE_DU_SIEGE'] satisfies RoleEnum[],
  SG: ['ADJOINT_SECRETAIRE_GENERAL'] satisfies RoleEnum[],
  ALL: [
    'ADJOINT_SECRETAIRE_GENERAL',
    'MEMBRE_COMMUN',
    'MEMBRE_DU_PARQUET',
    'MEMBRE_DU_SIEGE'
  ] satisfies RoleEnum[]
} as Record<'NONE' | 'MEMBER' | 'SG' | 'ALL', unknown[]>;
