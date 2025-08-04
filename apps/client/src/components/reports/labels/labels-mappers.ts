import { type DateOnlyJson, Magistrat, Transparency } from 'shared-models';
import { DateOnly } from '../../../models/date-only.model';

export type TransparencyLabel = string;

export const transparencyToLabel = (transparency: Transparency, dateTransparence: DateOnlyJson) => {
  return 'T ' + DateOnly.fromStoreModel(dateTransparence).toFormattedString() + ` (${transparency})`;
};
export const formationToLabel = (formation: Magistrat.Formation) => {
  switch (formation) {
    case Magistrat.Formation.SIEGE:
      return 'Siège';
    case Magistrat.Formation.PARQUET:
      return 'Parquet';
    default: {
      const _exhaustiveCheck: never = formation;
      console.info(_exhaustiveCheck);
      throw new Error(`Unhandled formation: ${JSON.stringify(formation)}`);
    }
  }
};
export const gradeToLabel = (grade: Magistrat.Grade) => {
  switch (grade) {
    case Magistrat.Grade.I:
      return 'I';
    case Magistrat.Grade.II:
      return 'II';
    case Magistrat.Grade.HH:
      return 'HH';
    default: {
      const _exhaustiveCheck: never = grade;
      console.info(_exhaustiveCheck);
      throw new Error(`Unhandled grade: ${JSON.stringify(grade)}`);
    }
  }
};
