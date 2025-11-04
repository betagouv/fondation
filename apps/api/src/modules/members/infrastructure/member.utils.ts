import { roleEnum } from 'src/modules/framework/drizzle/schemas';

export const MEMBER_ROLES = [
  'MEMBRE_COMMUN',
  'MEMBRE_DU_PARQUET',
  'MEMBRE_DU_SIEGE',
] as const satisfies (typeof roleEnum)['enumValues'][number][];
type MemberRole = (typeof MEMBER_ROLES)[number];

export function isMember<
  T extends { role: (typeof roleEnum)['enumValues'][number] },
>(user: T): user is T & { role: MemberRole } {
  return MEMBER_ROLES.includes(user.role as any);
}
