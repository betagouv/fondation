import z from 'zod';

import { type DocSystemUpdateCause } from '../domain/doc-system-update-cause';
import { DRAFT_CHANGES_BY, type DraftChangesBy } from '../domain/document.policies';

export const draftChangesBySchema = z.enum(DRAFT_CHANGES_BY).nullable();

type Person = { id: string; firstName: string; lastName: string };

export type DraftLastChange = {
  at: Date;
  by: Person | null;
  causes: DocSystemUpdateCause[];
  origin: 'PERSON' | 'SYSTEM';
};

export function draftLastChange(
  draft: {
    author: Person | null;
    createdAt: Date;
    editor: Person | null;
    systemUpdatedAt: Date | null;
    systemUpdates: readonly { cause: DocSystemUpdateCause }[];
    updatedAt: Date | null;
  },
  options: { overValidated: boolean },
): DraftLastChange | null {
  const systemCauses = draft.systemUpdates.map(({ cause }) => cause);

  // the first draft is the document itself, whose creation is already told: opening it changes nothing
  const openedAt = options.overValidated ? draft.createdAt : null;

  const changes: (Omit<DraftLastChange, 'at'> & { at: Date | null })[] = [
    // a draft nobody opened was opened by the application
    draft.author
      ? { at: openedAt, by: draft.author, causes: [], origin: 'PERSON' }
      : { at: openedAt, by: null, causes: systemCauses, origin: 'SYSTEM' },
    { at: draft.updatedAt, by: draft.editor, causes: [], origin: 'PERSON' },
    { at: draft.systemUpdatedAt, by: null, causes: systemCauses, origin: 'SYSTEM' },
  ];

  return changes.reduce<DraftLastChange | null>(
    (latest, change) =>
      change.at && (!latest || change.at > latest.at) ? { ...change, at: change.at } : latest,
    null,
  );
}

/** PERSON_AND_SYSTEM lasts until the draft is validated or discarded: editing it does not prove the person saw what the application changed */
export function draftChangesBy(version: {
  createdBy: string | null;
  status: 'DRAFT' | 'VALIDATED';
  systemUpdatedAt: Date | null;
  updatedBy: string | null;
}): DraftChangesBy | null {
  if (version.status === 'VALIDATED') return null;

  const byPerson = Boolean(version.createdBy || version.updatedBy);
  // a draft nobody opened was opened by the application, even before it kept the trace of it
  const bySystem = version.systemUpdatedAt !== null || !byPerson;

  if (byPerson && bySystem) return 'PERSON_AND_SYSTEM';
  return byPerson ? 'PERSON' : 'SYSTEM';
}
