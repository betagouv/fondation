import { DateOnly } from '@/models/date-only.model';
import type { DateOnlyJson } from '@/types/date-only.types';
import type { FormationEnum, GradeEnum } from '@/types/enums.types';

export const transparencyToLabel = (transparency: string, dateTransparence: DateOnlyJson) => {
  return 'T ' + DateOnly.fromStoreModel(dateTransparence).toFormattedString() + ` (${transparency})`;
};

export const formationToLabel = (formation: FormationEnum) => {
  switch (formation) {
    case 'SIEGE':
      return 'Siège';
    case 'PARQUET':
      return 'Parquet';
    default: {
      const _exhaustiveCheck: never = formation;
      console.info(_exhaustiveCheck);
      throw new Error(`Unhandled formation: ${JSON.stringify(formation)}`);
    }
  }
};

export const gradeToLabel = (grade: GradeEnum) => {
  switch (grade) {
    case 'I':
      return 'I';
    case 'II':
      return 'II';
    case 'HH':
      return 'HH';
    case 'III':
      return 'III';
    case 'G1':
      return 'G1';
    case 'G2':
      return 'G2';
    case 'G3':
      return 'G3';
    case 'G3sup':
      return 'G3sup';
    default: {
      const _exhaustiveCheck: never = grade;
      console.info(_exhaustiveCheck);
      throw new Error(`Unhandled grade: ${JSON.stringify(grade)}`);
    }
  }
};
