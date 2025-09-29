import { Magistrat, TypeDeSaisine } from 'shared-models';
import type { DropdownSelectOption } from './DropdownFilter';

export type FilterType = 'formation' | 'rapporteurs';

export const formationFilterOptions: DropdownSelectOption[] = [
  {
    value: Magistrat.Formation.PARQUET,
    label: 'Parquet'
  },
  {
    value: Magistrat.Formation.SIEGE,
    label: 'Siège'
  }
];

export const sessionTypeFilterOptions: DropdownSelectOption[] = [
  {
    value: TypeDeSaisine.TRANSPARENCE_GDS,
    label: 'Transparence GDS'
  }
];

export const filterConfigurations = {
  formation: {
    tagName: 'Formation',
    options: formationFilterOptions
  },
  sessionType: {
    tagName: 'Type de session',
    options: sessionTypeFilterOptions
  }
} as const;

export interface FiltersState {
  formations: string[];
  rapporteurs: string[];
  sessionType: string[];
}
