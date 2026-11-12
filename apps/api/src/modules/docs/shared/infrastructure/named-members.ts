import z from 'zod';

import type { Prisma } from '../../../../generated/prisma/client';
import type { CurrentNames, NamedMember } from '../domain/named-member';

const NAMED_MEMBERS = z.array(z.object({ id: z.string().nullable(), name: z.string() }));

/** the members a document row names, stored as jsonb */
export function parseNamedMembers(json: Prisma.JsonValue): NamedMember[] {
  return NAMED_MEMBERS.parse(json);
}

/** how the members of these files are printed today */
export function currentNamesOf(
  files: readonly {
    recusedMembers: readonly { fullTitledName: string; id: string }[];
    reporters: readonly { fullTitledName: string; id: string }[];
  }[],
): CurrentNames {
  const namesOf = (members: readonly { fullTitledName: string; id: string }[]) =>
    members.map(({ fullTitledName, id }) => [id, fullTitledName] as const);

  return {
    recusedMembers: new Map(files.flatMap(({ recusedMembers }) => namesOf(recusedMembers))),
    reporters: new Map(files.flatMap(({ reporters }) => namesOf(reporters))),
  };
}

export function namedMembersOf(members: readonly { fullTitledName: string; id: string }[]): NamedMember[] {
  return members.map(({ fullTitledName, id }) => ({ id, name: fullTitledName }));
}
