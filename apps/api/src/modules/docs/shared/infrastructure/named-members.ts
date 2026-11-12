import z from 'zod';

import type { Prisma } from '../../../../generated/prisma/client';
import type { NamedMember } from '../domain/named-member';

const NAMED_MEMBERS = z.array(z.object({ id: z.string().nullable(), name: z.string() }));

/** the members a document row names, stored as jsonb */
export function parseNamedMembers(json: Prisma.JsonValue): NamedMember[] {
  return NAMED_MEMBERS.parse(json);
}

export function namedMembersOf(members: readonly { fullTitledName: string; id: string }[]): NamedMember[] {
  return members.map(({ fullTitledName, id }) => ({ id, name: fullTitledName }));
}
