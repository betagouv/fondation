import { z } from 'zod';

import { MEMBER_ROLES } from '../../shared/role.enum';

export type MemberRole = (typeof MEMBER_ROLES)[number];

export function isMember<T extends { role: string }>(user: T): user is T & { role: MemberRole } {
  return MEMBER_ROLES.includes(user.role as any);
}

export const MEMBER_FORMATIONS = ['COMMUN', 'PARQUET', 'SIEGE'] as const;
export type MemberFormation = (typeof MEMBER_FORMATIONS)[number];

const MEMBER_FORMATION_BY_ROLE = {
  MEMBRE_COMMUN: { id: 'COMMUN', label: 'Commun' },
  MEMBRE_DU_PARQUET: { id: 'PARQUET', label: 'Parquet' },
  MEMBRE_DU_SIEGE: { id: 'SIEGE', label: 'Siège' },
} as const satisfies Record<MemberRole, { id: MemberFormation; label: string }>;

export const MemberFormationSchema = z.object({ id: z.enum(MEMBER_FORMATIONS), label: z.string() });

export function memberFormationOf(role: MemberRole): z.infer<typeof MemberFormationSchema> {
  return MEMBER_FORMATION_BY_ROLE[role];
}

/** no formation asked means every member */
export function memberRolesOf(formations: readonly MemberFormation[]): MemberRole[] {
  return MEMBER_ROLES.filter(
    (role) => formations.length === 0 || formations.includes(MEMBER_FORMATION_BY_ROLE[role].id),
  );
}
