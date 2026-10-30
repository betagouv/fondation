import { type DraftChangesBy } from './draft-changes-by';

export function canValidateDocument(document: { isValidated: boolean }): boolean {
  return !document.isValidated;
}

/** what the application brought in is taken without asking: only a person's draft is theirs to drop */
export function canDiscardDraft(draft: {
  changesBy: DraftChangesBy | null;
  hasValidatedVersion: boolean;
}): boolean {
  return draft.hasValidatedVersion && draft.changesBy === 'PERSON';
}
