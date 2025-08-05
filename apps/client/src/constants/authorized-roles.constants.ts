import { Role } from 'shared-models';

const MEMBER_ROLES: Role[] = [Role.MEMBRE_COMMUN, Role.MEMBRE_DU_PARQUET, Role.MEMBRE_DU_SIEGE] as const;

const SECRETARIAT_GENERAL_ROLES: Role[] = [Role.ADJOINT_SECRETAIRE_GENERAL] as const;

type RoleMap = 'MEMBER' | 'SG';

export const AUTHORIZED_ROLES: Record<RoleMap, Role[]> = {
  MEMBER: MEMBER_ROLES,
  SG: SECRETARIAT_GENERAL_ROLES
};
