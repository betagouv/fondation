import { Magistrat } from 'shared-models';
import type { DateOnlyStoreModel } from './date-only.model';

export const getTransparenceCompositeId = (
  name: string,
  formation: Magistrat.Formation,
  date: DateOnlyStoreModel
): string => {
  return `${name}-${formation}-${date.year}-${date.month}-${date.day}`;
};

export const parseTransparenceCompositeId = (
  compositeId: string
): {
  name: string;
  formation: Magistrat.Formation;
  date: DateOnlyStoreModel;
} | null => {
  const parts = compositeId.split('-');
  if (parts.length < 5) return null;

  const day = parseInt(parts[parts.length - 1]!);
  const month = parseInt(parts[parts.length - 2]!);
  const year = parseInt(parts[parts.length - 3]!);
  const formation = parts[parts.length - 4] as Magistrat.Formation;
  const name = parts.slice(0, parts.length - 4).join('-');

  if (isNaN(day) || isNaN(month) || isNaN(year)) return null;

  return {
    name,
    formation,
    date: { year, month: month as Month, day }
  };
};
