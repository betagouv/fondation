import { Magistrat, PrioriteEnum, PrioriteLabels, TypeDeSaisine, TypeDeSaisineLabels } from 'shared-models';

export type FilterType = 'formation' | 'rapporteurs';

type FormationOptions = {
  value: Magistrat.Formation;
  label: string;
};
export const FORMATION_OPTIONS: Array<FormationOptions> = [
  {
    value: Magistrat.Formation.PARQUET,
    label: 'Parquet'
  },
  {
    value: Magistrat.Formation.SIEGE,
    label: 'Siège'
  }
];

type SessionTypeOptions = {
  value: TypeDeSaisine;
  label: (typeof TypeDeSaisineLabels)[TypeDeSaisine];
};
export const SAISINE_OPTIONS: Array<SessionTypeOptions> = [
  {
    value: TypeDeSaisine.TRANSPARENCE_GDS,
    label: TypeDeSaisineLabels.TRANSPARENCE_GDS
  }
];

type PrioriteOptions = {
  value: PrioriteEnum;
  label: (typeof PrioriteLabels)[PrioriteEnum];
};
export const PRIORITE_OPTIONS: Array<PrioriteOptions> = [
  {
    value: PrioriteEnum.ETOILE,
    label: PrioriteLabels.ETOILE
  },
  {
    value: PrioriteEnum.OUTRE_MER,
    label: PrioriteLabels.OUTRE_MER
  },
  {
    value: PrioriteEnum.PROFILE,
    label: PrioriteLabels.PROFILE
  }
];

export type FilterConfigurations = {
  formation: {
    tagName: 'Formation';
    options: Array<FormationOptions>;
  };
  sessionType: {
    tagName: 'Type de session';
    options: Array<SessionTypeOptions>;
  };
  priorite: {
    tagName: 'Priorité';
    options: Array<PrioriteOptions>;
  };
};

export const filterConfigurations: FilterConfigurations = {
  formation: {
    tagName: 'Formation',
    options: FORMATION_OPTIONS
  },
  sessionType: {
    tagName: 'Type de session',
    options: SAISINE_OPTIONS
  },
  priorite: {
    tagName: 'Priorité',
    options: PRIORITE_OPTIONS
  }
} as const;

export interface FiltersState {
  rapporteurs: string[];
  priorite: Array<PrioriteOptions['value']>;
}
