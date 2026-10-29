import { z } from 'zod';

import { MEMBER_ROLES } from '../../shared/role.enum';

export type MemberRole = (typeof MEMBER_ROLES)[number];

export function isMember<T extends { role: string }>(user: T): user is T & { role: MemberRole } {
  return MEMBER_ROLES.includes(user.role as any);
}

const MEMBER_FORMATIONS = {
  MEMBRE_COMMUN: { id: 'COMMUN', label: 'Commun' },
  MEMBRE_DU_PARQUET: { id: 'PARQUET', label: 'Parquet' },
  MEMBRE_DU_SIEGE: { id: 'SIEGE', label: 'Siège' },
} as const satisfies Record<MemberRole, { id: string; label: string }>;

export const MemberFormationSchema = z.object({
  id: z.enum(['COMMUN', 'PARQUET', 'SIEGE']),
  label: z.string(),
});

export function memberFormationOf(role: MemberRole): z.infer<typeof MemberFormationSchema> {
  return MEMBER_FORMATIONS[role];
}
