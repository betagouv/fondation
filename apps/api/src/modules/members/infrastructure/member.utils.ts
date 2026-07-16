import { Role } from 'shared-models';

import { FormationEnum } from 'src/modules/shared/formation.enum';
import { assertNever } from 'src/utils/assert-never';

export const MEMBER_ROLES = [
  'MEMBRE_COMMUN',
  'MEMBRE_DU_PARQUET',
  'MEMBRE_DU_SIEGE',
] as const satisfies Role[keyof Role][];
export type MemberRole = (typeof MEMBER_ROLES)[number];

/** @return undefined means no restriction on the formation */
export function roleToFormation(role: Role): FormationEnum | undefined {
  switch (role) {
    case Role.MEMBRE_COMMUN:
    case Role.ADJOINT_SECRETAIRE_GENERAL:
    case Role.ADMIN:
      return undefined;
    case Role.MEMBRE_DU_PARQUET:
      return 'PARQUET';
    case Role.MEMBRE_DU_SIEGE:
      return 'SIEGE';
    default:
      return assertNever(role);
  }
}

export function isMember<T extends { role: string }>(user: T): user is T & { role: MemberRole } {
  return MEMBER_ROLES.includes(user.role as any);
}
