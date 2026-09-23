import z from 'zod';

export const draftChangesBySchema = z.enum(['PERSON', 'PERSON_AND_SYSTEM', 'SYSTEM']).nullable();

/** PERSON_AND_SYSTEM lasts until the draft is validated or discarded: editing it does not prove the person saw what the application changed */
export function draftChangesBy(version: {
  createdBy: string | null;
  status: 'DRAFT' | 'VALIDATED';
  systemUpdatedAt: Date | null;
  updatedBy: string | null;
}): z.infer<typeof draftChangesBySchema> {
  if (version.status === 'VALIDATED') return null;

  const byPerson = Boolean(version.createdBy || version.updatedBy);
  // a draft nobody opened was opened by the application, even before it kept the trace of it
  const bySystem = version.systemUpdatedAt !== null || !byPerson;

  if (byPerson && bySystem) return 'PERSON_AND_SYSTEM';
  return byPerson ? 'PERSON' : 'SYSTEM';
}
