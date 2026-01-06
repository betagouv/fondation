import type { RoleEnum } from '@/types/enums.types';

export const AUTHORIZED_ROLES = {
  MEMBER: ['MEMBRE_COMMUN', 'MEMBRE_DU_PARQUET', 'MEMBRE_DU_SIEGE'] as const satisfies RoleEnum[],
  SG: ['ADJOINT_SECRETAIRE_GENERAL'] as const satisfies RoleEnum[]
} as Record<'MEMBER' | 'SG', unknown[]>;
