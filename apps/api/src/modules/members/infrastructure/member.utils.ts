import { MEMBER_ROLES } from '../../shared/role.enum';

export type MemberRole = (typeof MEMBER_ROLES)[number];

export function isMember<T extends { role: string }>(user: T): user is T & { role: MemberRole } {
  return MEMBER_ROLES.includes(user.role as any);
}
