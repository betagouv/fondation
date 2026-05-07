import {
  FormationEnum,
  PrioriteEnum,
  PrioriteEnumLabels,
  TypeDeSaisineEnum,
  TypeDeSaisineEnumLabels,
} from '@/types/enums.types';

export type FilterType = 'formation' | 'rapporteurs';

type FormationOptions = {
  value: FormationEnum;
  label: string;
};
export const FORMATION_OPTIONS: FormationOptions[] = [
  {
    value: 'PARQUET',
    label: 'Parquet',
  },
  {
    value: 'SIEGE',
    label: 'Siège',
  },
];

export const FILTER_RAPPORTEUR_NOBODY = { value: 'EMPTY', label: 'aucun' };

type SessionTypeOptions = {
  value: TypeDeSaisineEnum;
  label: (typeof TypeDeSaisineEnumLabels)[TypeDeSaisineEnum];
};
export const SAISINE_OPTIONS: SessionTypeOptions[] = [
  {
    value: TypeDeSaisineEnum.TRANSPARENCE_GDS,
    label: TypeDeSaisineEnumLabels.TRANSPARENCE_GDS,
  },
];

type PrioriteOptions = {
  value: PrioriteEnum;
  label: (typeof PrioriteEnumLabels)[PrioriteEnum];
};
export const PRIORITE_OPTIONS: PrioriteOptions[] = [
  {
    value: PrioriteEnum.ETOILE,
    label: PrioriteEnumLabels.ETOILE,
  },
  {
    value: PrioriteEnum.OUTRE_MER,
    label: PrioriteEnumLabels.OUTRE_MER,
  },
  {
    value: PrioriteEnum.PROFILE,
    label: PrioriteEnumLabels.PROFILE,
  },
];

export type FilterConfigurations = {
  formation: {
    tagName: 'Formation';
    options: FormationOptions[];
  };
  sessionType: {
    tagName: 'Type de session';
    options: SessionTypeOptions[];
  };
  priorite: {
    tagName: 'Priorité';
    options: PrioriteOptions[];
  };
};

export const filterConfigurations: FilterConfigurations = {
  formation: {
    tagName: 'Formation',
    options: FORMATION_OPTIONS,
  },
  sessionType: {
    tagName: 'Type de session',
    options: SAISINE_OPTIONS,
  },
  priorite: {
    tagName: 'Priorité',
    options: PRIORITE_OPTIONS,
  },
} as const;

export interface FiltersState {
  rapporteurs: string[];
  priorite: PrioriteOptions['value'][];
}
