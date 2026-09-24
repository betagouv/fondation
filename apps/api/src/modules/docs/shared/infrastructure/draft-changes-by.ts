import z from 'zod';

import { type DocSystemUpdateCause } from '../domain/doc-system-update-cause';

export const draftChangesBySchema = z.enum(['PERSON', 'PERSON_AND_SYSTEM', 'SYSTEM']).nullable();

type Person = { id: string; firstName: string; lastName: string };

export type DraftLastChange = {
  at: Date;
  by: Person | null;
  causes: DocSystemUpdateCause[];
  origin: 'PERSON' | 'SYSTEM';
};

export function draftLastChange(draft: {
  author: Person | null;
  createdAt: Date;
  editor: Person | null;
  systemUpdatedAt: Date | null;
  systemUpdates: readonly { cause: DocSystemUpdateCause }[];
  updatedAt: Date | null;
}): DraftLastChange {
  const systemCauses = draft.systemUpdates.map(({ cause }) => cause);

  const changes: (Omit<DraftLastChange, 'at'> & { at: Date | null })[] = [
    { at: draft.updatedAt, by: draft.editor, causes: [], origin: 'PERSON' },
    { at: draft.systemUpdatedAt, by: null, causes: systemCauses, origin: 'SYSTEM' },
  ];

  // a draft nobody opened was opened by the application
  const opening: DraftLastChange = draft.author
    ? { at: draft.createdAt, by: draft.author, causes: [], origin: 'PERSON' }
    : { at: draft.createdAt, by: null, causes: systemCauses, origin: 'SYSTEM' };

  return changes.reduce<DraftLastChange>(
    (latest, change) => (change.at && change.at > latest.at ? { ...change, at: change.at } : latest),
    opening,
  );
}

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
