import z from 'zod';

import type { Prisma } from 'src/generated/prisma/client';
import { fullname } from 'src/utils/user.util';

const writerSchema = z.object({ id: z.string(), name: z.string() });

/** who opened the draft and when, and who last worked on it: nobody named means the application */
export const draftTraceSchema = z
  .object({
    openedAt: z.iso.datetime(),
    openedBy: writerSchema.nullable(),
    systemUpdatedAt: z.iso.datetime().nullable(),
    updatedAt: z.iso.datetime().nullable(),
    updatedBy: writerSchema.nullable(),
  })
  .nullable();

type Person = { firstName: string; id: string; lastName: string } | null;

export const DRAFT_TRACE_SELECT = {
  author: { select: { firstName: true, id: true, lastName: true } },
  createdAt: true,
  editor: { select: { firstName: true, id: true, lastName: true } },
  systemUpdatedAt: true,
  updatedAt: true,
} as const satisfies Prisma.AgendaVersionSelect & Prisma.OfficialReportVersionSelect;

export function draftTrace(version: {
  author: Person;
  createdAt: Date;
  editor: Person;
  status: 'DRAFT' | 'VALIDATED';
  systemUpdatedAt: Date | null;
  updatedAt: Date | null;
}): z.infer<typeof draftTraceSchema> {
  if (version.status === 'VALIDATED') return null;

  const writer = (person: Person) => (person ? { id: person.id, name: fullname(person) } : null);

  return {
    openedAt: version.createdAt.toISOString(),
    openedBy: writer(version.author),
    systemUpdatedAt: version.systemUpdatedAt?.toISOString() ?? null,
    updatedAt: version.updatedAt?.toISOString() ?? null,
    updatedBy: writer(version.editor),
  };
}

/** when a document went through a step, validation or presentation, and who took it */
export const traceSchema = z.object({ at: z.iso.datetime(), by: writerSchema.nullable() }).nullable();

export const VALIDATION_TRACE_SELECT = {
  validatedAt: true,
  validator: { select: { firstName: true, id: true, lastName: true } },
} as const satisfies Prisma.AgendaVersionSelect & Prisma.OfficialReportVersionSelect;

export function traceOf(
  at: Date | null | undefined,
  person: Person | undefined,
): z.infer<typeof traceSchema> {
  if (!at) return null;

  return { at: at.toISOString(), by: person ? { id: person.id, name: fullname(person) } : null };
}
