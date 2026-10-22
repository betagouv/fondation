import { assertNever } from '../../../utils/assert-never';
import { FormationEnum } from '../../shared/formation.enum';
import { MEMBER_ROLES, type RoleEnum } from '../../shared/role.enum';

export type MemberRole = (typeof MEMBER_ROLES)[number];

/** @return undefined means no restriction on the formation */
export function roleToFormation(role: RoleEnum): FormationEnum | undefined {
  switch (role) {
    case 'MEMBRE_COMMUN':
    case 'ADJOINT_SECRETAIRE_GENERAL':
      return undefined;
    case 'MEMBRE_DU_PARQUET':
      return 'PARQUET';
    case 'MEMBRE_DU_SIEGE':
      return 'SIEGE';
    default:
      return assertNever(role);
  }
}

export function isMember<T extends { role: string }>(user: T): user is T & { role: MemberRole } {
  return MEMBER_ROLES.includes(user.role as any);
}
