export const StatutAffectationEnum = {
  BROUILLON: 'BROUILLON',
  PUBLIEE: 'PUBLIEE',
} as const;
export type StatutAffectationEnum = (typeof StatutAffectationEnum)[keyof typeof StatutAffectationEnum];
