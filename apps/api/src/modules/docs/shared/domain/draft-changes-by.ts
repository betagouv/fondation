export const DRAFT_CHANGES_BY = ['PERSON', 'PERSON_AND_SYSTEM', 'SYSTEM'] as const;

export type DraftChangesBy = (typeof DRAFT_CHANGES_BY)[number];
