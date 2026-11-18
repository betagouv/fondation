import { CAUSES_EACH_DRAFT_FOLLOWS } from './doc-system-update-cause';
import { type DraftChanges } from './draft-changes-by';

export function canValidateDocument(document: { isValidated: boolean }): boolean {
  return !document.isValidated;
}

/**
 * what the application brought in is taken without asking: only a person's draft is theirs to drop, unless
 * the application only brought what the next draft follows again. A draft updated before its causes were
 * kept has none to vouch for it.
 */
export function canDiscardDraft(draft: DraftChanges & { hasValidatedVersion: boolean }): boolean {
  if (!draft.hasValidatedVersion || !draft.changesBy) return false;
  if (draft.changesBy === 'PERSON') return true;

  return (
    draft.systemCauses.length > 0 && draft.systemCauses.every((cause) => CAUSES_EACH_DRAFT_FOLLOWS.has(cause))
  );
}
