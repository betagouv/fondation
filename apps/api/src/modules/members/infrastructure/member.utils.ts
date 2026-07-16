import { FormationEnum } from 'src/modules/shared/formation.enum';
import type { RoleEnum } from 'src/modules/shared/role.enum';
import { assertNever } from 'src/utils/assert-never';

export const MEMBER_ROLES = [
  'MEMBRE_COMMUN',
  'MEMBRE_DU_PARQUET',
  'MEMBRE_DU_SIEGE',
] as const satisfies RoleEnum[keyof RoleEnum][];
export type MemberRole = (typeof MEMBER_ROLES)[number];

/** @return undefined means no restriction on the formation */
export function roleToFormation(role: RoleEnum): FormationEnum | undefined {
  switch (role) {
    case 'MEMBRE_COMMUN':
    case 'ADJOINT_SECRETAIRE_GENERAL':
    case 'ADMIN':
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
