import { Magistrat } from 'shared-models';
import type { FilterOption } from './DropdownFilter';

export const formationFilterOptions: FilterOption[] = [
  {
    value: Magistrat.Formation.PARQUET,
    label: 'Parquet'
  },
  {
    value: Magistrat.Formation.SIEGE,
    label: 'Siège'
  }
];

export type FilterType = 'formation';

export const filterConfigurations = {
  formation: {
    tagName: 'Formation',
    options: formationFilterOptions
  }
} as const;

export interface FiltersState {
  formations: string[];
}
