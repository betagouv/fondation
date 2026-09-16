import type { DetailedReportDto } from '@api/types';

export type GradeEnum = NonNullable<DetailedReportDto['grade']>;

export const GradeEnum = {
  I: 'I',
  II: 'II',
  HH: 'HH',
  G1: 'G1',
  G2: 'G2',
  G3: 'G3',
  G3sup: 'G3sup',
  MH: 'MH',
} as const satisfies Record<GradeEnum, GradeEnum>;
