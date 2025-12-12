import { Magistrat } from 'shared-models';

const GRADES = new Set<unknown>(Object.values(Magistrat.Grade));
export function isGrade(value: unknown): value is Magistrat.Grade {
  return GRADES.has(value);
}
