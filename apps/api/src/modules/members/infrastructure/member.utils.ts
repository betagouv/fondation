import { Magistrat, Role } from 'shared-models';
import { assertNever } from 'src/utils/assert-never';

export const MEMBER_ROLES = [
  'MEMBRE_COMMUN',
  'MEMBRE_DU_PARQUET',
  'MEMBRE_DU_SIEGE',
] as const satisfies Role[keyof Role][];
type MemberRole = (typeof MEMBER_ROLES)[number];

export function formationToMemberRole(
  formation?: Magistrat.Formation,
): MemberRole[] {
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

/** @return undefined means no restriction on the formation */
export function roleToFormation(role: Role): Magistrat.Formation | undefined {
  switch (role) {
    case Role.MEMBRE_COMMUN:
    case Role.ADJOINT_SECRETAIRE_GENERAL:
      return undefined;
    case Role.MEMBRE_DU_PARQUET:
      return Magistrat.Formation.PARQUET;
    case Role.MEMBRE_DU_SIEGE:
      return Magistrat.Formation.SIEGE;
    default:
      return assertNever(role);
  }
}

export function isMember<T extends { role: string }>(
  user: T,
): user is T & { role: MemberRole } {
  return MEMBER_ROLES.includes(user.role as any);
}
