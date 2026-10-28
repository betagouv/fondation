export const DRAFT_CHANGES_BY = ['PERSON', 'PERSON_AND_SYSTEM', 'SYSTEM'] as const;

export type DraftChangesBy = (typeof DRAFT_CHANGES_BY)[number];

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
