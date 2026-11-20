export const PUBLICATION_STATUSES = [
  'NEVER_PUBLISHED',
  'NOTHING_TO_PUBLISH',
  'PUBLISHED',
  'UNPUBLISHED_CHANGES',
] as const;
export type PublicationStatus = (typeof PUBLICATION_STATUSES)[number];
