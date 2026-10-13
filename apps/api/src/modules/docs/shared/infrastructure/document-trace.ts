import z from 'zod';

import type { Prisma } from 'src/generated/prisma/client';
import {
  DOC_SYSTEM_UPDATE_CAUSES,
  type DocSystemUpdateCause,
} from 'src/modules/docs/shared/domain/doc-system-update-cause';
import { DateOnly, dateOnlyJsonSchema } from 'src/utils/date-only';
import { dateToTimeOnly, timeOnlySchema } from 'src/utils/time-only';
import { fullname } from 'src/utils/user.util';

const writerSchema = z.object({ id: z.string(), name: z.string() });

/** who opened the draft and when, and who last worked on it: nobody named means the application */
export const draftTraceSchema = z
  .object({
    openedAt: z.iso.datetime(),
    openedBy: writerSchema.nullable(),
    systemCauses: z.array(z.enum(DOC_SYSTEM_UPDATE_CAUSES)),
    systemUpdatedAt: z.iso.datetime().nullable(),
    updatedAt: z.iso.datetime().nullable(),
    updatedBy: writerSchema.nullable(),
  })
  .nullable();

type Person = { firstName: string; id: string; lastName: string } | null;

function writerOf(person: Person): z.infer<typeof writerSchema> | null {
  return person ? { id: person.id, name: fullname(person) } : null;
}

export const DRAFT_TRACE_SELECT = {
  author: { select: { firstName: true, id: true, lastName: true } },
  createdAt: true,
  editor: { select: { firstName: true, id: true, lastName: true } },
  systemUpdatedAt: true,
  systemUpdates: { orderBy: { at: 'asc' }, select: { cause: true } },
  updatedAt: true,
} as const satisfies Prisma.AgendaVersionSelect & Prisma.OfficialReportVersionSelect;

export function draftTrace(version: {
  author: Person;
  createdAt: Date;
  editor: Person;
  status: 'DRAFT' | 'VALIDATED';
  systemUpdatedAt: Date | null;
  systemUpdates: readonly { cause: DocSystemUpdateCause }[];
  updatedAt: Date | null;
}): z.infer<typeof draftTraceSchema> {
  if (version.status === 'VALIDATED') return null;

  return {
    openedAt: version.createdAt.toISOString(),
    openedBy: writerOf(version.author),
    systemCauses: version.systemUpdates.map(({ cause }) => cause),
    systemUpdatedAt: version.systemUpdatedAt?.toISOString() ?? null,
    updatedAt: version.updatedAt?.toISOString() ?? null,
    updatedBy: writerOf(version.editor),
  };
}

/** when a document was validated, and by whom */
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

  return { at: at.toISOString(), by: writerOf(person ?? null) };
}

/** a restitution is dated by its notice and its ending time rather than by the click, which may come later */
export const presentationTraceSchema = z.object({
  by: writerSchema.nullable(),
  date: dateOnlyJsonSchema,
  /** null on the notices presented without an ending time */
  endTime: timeOnlySchema.nullable(),
});

export function presentationTraceOf(plan: {
  date: Date;
  endTime: Date | null;
  presenter: Person;
}): z.infer<typeof presentationTraceSchema> {
  return {
    by: writerOf(plan.presenter),
    date: DateOnly.fromUtcDate(plan.date).toJson(),
    endTime: plan.endTime ? dateToTimeOnly(plan.endTime) : null,
  };
}
