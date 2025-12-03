import { Magistrat } from 'shared-models';
import { roleEnum } from 'src/modules/framework/drizzle/schemas';
import { assertNever } from 'src/utils/assert-never';

export const MEMBER_ROLES = [
  'MEMBRE_COMMUN',
  'MEMBRE_DU_PARQUET',
  'MEMBRE_DU_SIEGE',
] as const satisfies (typeof roleEnum)['enumValues'][number][];
type MemberRole = (typeof MEMBER_ROLES)[number];

export function memberRoles(formation?: Magistrat.Formation): MemberRole[] {
  switch (formation) {
    case Magistrat.Formation.PARQUET:
      return ['MEMBRE_COMMUN', 'MEMBRE_DU_PARQUET'];
    case Magistrat.Formation.SIEGE:
      return ['MEMBRE_COMMUN', 'MEMBRE_DU_SIEGE'];
    case undefined:
      return [...MEMBER_ROLES];
    default:
      return assertNever(formation);
  }
}

export function isMember<
  T extends { role: (typeof roleEnum)['enumValues'][number] },
>(user: T): user is T & { role: MemberRole } {
  return MEMBER_ROLES.includes(user.role as any);
}
