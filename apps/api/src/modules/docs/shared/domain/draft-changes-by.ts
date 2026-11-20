import { type DocSystemUpdateCause } from './doc-system-update-cause';

export const DRAFT_CHANGES_BY = ['PERSON', 'PERSON_AND_SYSTEM', 'SYSTEM'] as const;

export type DraftChangesBy = (typeof DRAFT_CHANGES_BY)[number];

/** who changed the open draft, and why the application did: null and none without a draft */
export type DraftChanges = {
  changesBy: DraftChangesBy | null;
  systemCauses: readonly DocSystemUpdateCause[];
};
