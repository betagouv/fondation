export const LolfiGradeEnum = { G1: 'G1', G2: 'G2', G3: 'G3', G3sup: 'G3sup' } as const;
export type LolfiGradeEnum = (typeof LolfiGradeEnum)[keyof typeof LolfiGradeEnum];

export const LolfiFormationEnum = { PARQUET: 'PARQUET', SIEGE: 'SIEGE' } as const;
export type LolfiFormationEnum = (typeof LolfiFormationEnum)[keyof typeof LolfiFormationEnum];

/* The codes before the reform of 2025-12-01, which a few magistrats still bear */
export const LOLFI_LEGACY_GRADES = ['I', 'II', 'MH'] as const;
export type LolfiLegacyGrade = (typeof LOLFI_LEGACY_GRADES)[number];

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
  /* LOLFI gives each post its own number: tells apart two posts identical in everything else */
  seat?: number;
};

/* Dates are written as LOLFI does: dd/MM/yyyy */
export type LolfiCandidate = {
  administrativePosition?: string;
  birthDate?: string;
  careerHistory?: string;
  civilite?: 'M.' | 'MME';
  designated?: boolean;
  /* Left undefined, the generator draws one. null means the magistrat has no mailbox */
  email?: string | null;
  firstName: string;
  gradeDate?: string;
  id?: number;
  installationDate?: string;
  lastName: string;
  legacyGrade?: LolfiLegacyGrade;
  maritalStatus?: string | null;
  marriedName?: string;
  nominationDate?: string;
  /* A magistrat may apply several times: id then identifies the magistrat, and this each candidature */
  nominationId?: number;
  phone?: string;
  position: LolfiPosition;
  /* The order of the ministry, which sets the numbers of the dossiers */
  positionSort?: number;
  rank?: number;
  targetPosition: LolfiPosition;
  usedName?: string;
};

export type LolfiMagistrat = Omit<
  LolfiCandidate,
  'designated' | 'id' | 'nominationId' | 'positionSort' | 'rank' | 'targetPosition'
> & { id: number };

export type LolfiArchiveContent = {
  /* Left out of MAGISTRATS.xml: an import makes inactive the magistrats it no longer holds */
  absentMagistratIds?: readonly number[];
  /* LOLFI sends its whole referential, not only what the candidates use */
  administrativePositions?: readonly LolfiAdministrativePosition[];
  functions?: readonly LolfiFunction[];
  jurisdictions?: readonly LolfiJurisdiction[];
  jurisdictionTypes?: readonly LolfiJurisdictionType[];
  /* LOLFI sends the whole corps, including the magistrats candidate to nothing */
  magistrats?: readonly LolfiMagistrat[];

  sessions: {
    candidates: LolfiCandidate[];
    createdAt: string;
    id?: number;
    /* written as is, whereas a name gets the session id appended to stay unique across tests */
    label?: string;
    name?: string;
  }[];
};
