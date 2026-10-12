export const GradeEnum = {
  I: 'I',
  II: 'II',
  HH: 'HH',
  G1: 'G1',
  G2: 'G2',
  G3: 'G3',
  G3SUP: 'G3sup',
  MH: 'MH',
} as const;
export type GradeEnum = (typeof GradeEnum)[keyof typeof GradeEnum];
