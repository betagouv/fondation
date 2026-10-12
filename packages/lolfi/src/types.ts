export const LolfiGradeEnum = { G1: 'G1', G2: 'G2', G3: 'G3', G3sup: 'G3sup' } as const;
export type LolfiGradeEnum = (typeof LolfiGradeEnum)[keyof typeof LolfiGradeEnum];

export const LolfiFormationEnum = { PARQUET: 'PARQUET', SIEGE: 'SIEGE' } as const;
export type LolfiFormationEnum = (typeof LolfiFormationEnum)[keyof typeof LolfiFormationEnum];

export type LolfiAdministrativePosition = { id: string; label: string; rate: number };

export type LolfiJurisdictionType = { id: string; label: string };

export type LolfiJurisdiction = {
  /* LolfiJurisdiction.id */
  arrondissement?: string;
  city?: string;
  id: string;
  jurisdictionType?: string;
  label?: string;
  postalCode?: string;
  /* LolfiJurisdiction.id */
  ressort?: string;
};

export type LolfiFunction = {
  addition?: string;
  formation: LolfiFormationEnum;
  id: string;
  label: string;
  labelOneFemale?: string;
  labelOneMale?: string;
};

export type LolfiPosition = {
  /* LOLFI attaches no function to a detachment nor to an absence of assignment */
  function?: LolfiFunction;
  grade?: LolfiGradeEnum;
  jurisdiction: LolfiJurisdiction;
  profile?: string;
  profileId?: string | null;
};

/* Dates are written as LOLFI does: dd/MM/yyyy */
export type LolfiArchiveContent = {
  /* LOLFI sends its whole referential, not only what the candidates use */
  administrativePositions?: readonly LolfiAdministrativePosition[];
  functions?: readonly LolfiFunction[];
  jurisdictions?: readonly LolfiJurisdiction[];
  jurisdictionTypes?: readonly LolfiJurisdictionType[];

  sessions: {
    candidates: {
      administrativePosition?: string;
      birthDate?: string;
      careerHistory?: string;
      civilite?: 'M.' | 'MME';
      designated?: boolean;
      email?: string;
      firstName: string;
      gradeDate?: string;
      id?: number;
      installationDate?: string;
      lastName: string;
      maritalStatus?: string | null;
      marriedName?: string;
      nominationDate?: string;
      phone?: string;
      position: LolfiPosition;
      rank?: number;
      targetPosition: LolfiPosition;
      usedName?: string;
    }[];
    createdAt: string;
    id?: number;
    /* written as is, whereas a name gets the session id appended to stay unique across tests */
    label?: string;
    name?: string;
  }[];
};
