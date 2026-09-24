export const DOC_SYSTEM_UPDATE_CAUSES = [
  'AGENDA_DATE',
  'AGENDA_PROPOSITIONS',
  'AGENDA_TEXT',
  'OUTCOME',
  'REPORTERS',
  'SESSION_DATE',
] as const;

export type DocSystemUpdateCause = (typeof DOC_SYSTEM_UPDATE_CAUSES)[number];
