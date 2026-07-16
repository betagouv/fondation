export const PriorityEnum = {
  ETOILE: 'ETOILE',
  OUTRE_MER: 'OUTRE_MER',
  PROFILE: 'PROFILE',
} as const;
export type PriorityEnum = (typeof PriorityEnum)[keyof typeof PriorityEnum];
