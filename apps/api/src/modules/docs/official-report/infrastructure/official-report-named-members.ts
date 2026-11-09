import z from 'zod';

import type { Prisma } from '../../../../generated/prisma/client';
import type { OfficialReportNamedMember } from '../domain/official-report-types';

const NAMED_MEMBERS = z.array(z.object({ id: z.string().nullable(), name: z.string() }));

/** the members a report row names, stored as jsonb */
export function parseNamedMembers(json: Prisma.JsonValue): OfficialReportNamedMember[] {
  return NAMED_MEMBERS.parse(json);
}

export function namedMembersOf(
  members: readonly { fullTitledName: string; id: string }[],
): OfficialReportNamedMember[] {
  return members.map(({ fullTitledName, id }) => ({ id, name: fullTitledName }));
}
