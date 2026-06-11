export const LolfiGradeEnum = { G1: 'G1', G2: 'G2', G3: 'G3', G3sup: 'G3sup' } as const;
export type LolfiGradeEnum = (typeof LolfiGradeEnum)[keyof typeof LolfiGradeEnum];

export const LolfiFormationEnum = { SIEGE: 'SIEGE', PARQUET: 'PARQUET' } as const;
export type LolfiFormationEnum = (typeof LolfiFormationEnum)[keyof typeof LolfiFormationEnum];

export type LolfiJurisdiction = {
  id: string;
  label?: string;
  jurisdictionType?: string;

  /* LolfiJurisdiction.id */
  ressort?: string;
  /* LolfiJurisdiction.id */
  arrondissement?: string;
};

export type LolfiFunction = {
  id: string;
  label: string;
  formation: LolfiFormationEnum;
  labelOneMale?: string;
  labelOneFemale?: string;
  addition?: string;
};

export type LolfiPosition = {
  jurisdiction: LolfiJurisdiction;
  function: LolfiFunction;
  grade?: LolfiGradeEnum;
};

export type LolfiData = {
  sessions: {
    name?: string;
    id?: number;
    createdAt: string;

    candidates: {
      firstName: string;
      lastName: string;
      usedName?: string;
      marriedName?: string;
      rank?: number;
      id?: number;
      civilite?: 'M.' | 'MME';
      position: LolfiPosition;
      targetPosition: LolfiPosition;
    }[];
  }[];
};
