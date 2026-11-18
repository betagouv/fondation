import { type DocSystemUpdateCause } from './doc-system-update-cause';
import { type DraftChangesBy } from './draft-changes-by';

/** who changed the open draft, and why the application did: null and none without a draft */
export type DraftChanges = {
  changesBy: DraftChangesBy | null;
  systemCauses: readonly DocSystemUpdateCause[];
};

export function canValidateDocument(document: { isValidated: boolean }): boolean {
  return !document.isValidated;
}

/**
 * what the application brought in is taken without asking: only a person's draft is theirs to drop.
 * Following a new name is the exception, as the validated version keeps the old one on purpose and the
 * next draft takes the new one again. A draft updated before its causes were kept has none to vouch for it.
 */
export function canDiscardDraft(draft: DraftChanges & { hasValidatedVersion: boolean }): boolean {
  if (!draft.hasValidatedVersion || !draft.changesBy) return false;
  if (draft.changesBy === 'PERSON') return true;

  return draft.systemCauses.length > 0 && draft.systemCauses.every((cause) => cause === 'DESIGNATION');
}
