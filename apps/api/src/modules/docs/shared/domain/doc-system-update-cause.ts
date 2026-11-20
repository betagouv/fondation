export const DOC_SYSTEM_UPDATE_CAUSES = [
  'AGENDA_DATE',
  'AGENDA_PROPOSITIONS',
  'AGENDA_TEXT',
  'DESIGNATION',
  'OUTCOME',
  'RECUSAL',
  'REPORTERS',
  'SESSION_DATE',
] as const;

export type DocSystemUpdateCause = (typeof DOC_SYSTEM_UPDATE_CAUSES)[number];

/** what a validated version ignores, as each draft opened on it follows it: dropping it loses nothing */
export const CAUSES_EACH_DRAFT_FOLLOWS: ReadonlySet<DocSystemUpdateCause> = new Set(['DESIGNATION']);
