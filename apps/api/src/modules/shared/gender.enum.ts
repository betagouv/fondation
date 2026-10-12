export const GenderEnum = {
  MALE: 'MALE',
  FEMALE: 'FEMALE',
} as const;
export type GenderEnum = (typeof GenderEnum)[keyof typeof GenderEnum];
