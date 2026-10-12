import { GradeEnum } from '../grade.enum';

const GRADES = new Set<unknown>(Object.values(GradeEnum));
export function isGrade(value: unknown): value is GradeEnum {
  return GRADES.has(value);
}
