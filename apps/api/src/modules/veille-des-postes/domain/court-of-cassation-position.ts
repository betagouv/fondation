export const COURT_OF_CASSATION_ID = 'CC  PARIS';

/* In the order of the hierarchy, which sorts the holders */
export const COURT_OF_CASSATION_POSITIONS = [
  'FIRST_PRESIDENT',
  'CHAMBER_PRESIDENT',
  'COUNSELLOR',
  'REFERENDARY_COUNSELLOR',
  'AUDITOR_FIRST_GRADE',
  'AUDITOR_SECOND_GRADE',
] as const;
export type CourtOfCassationPosition = (typeof COURT_OF_CASSATION_POSITIONS)[number];

export const HOLDER_SERVICES = ['EXTRAORDINARY', 'ORDINARY'] as const;
export type HolderService = (typeof HOLDER_SERVICES)[number];

export type RankedLolfiPositions = { functionIds: string[]; gradeIds: (string | null)[]; ranks: number[] };

const EXTRAORDINARY_SERVICE_COUNSELLOR = 'C SE';

const LABELS: Record<CourtOfCassationPosition, string> = {
  AUDITOR_FIRST_GRADE: 'Auditeur 1er grade',
  AUDITOR_SECOND_GRADE: 'Auditeur 2e grade',
  CHAMBER_PRESIDENT: 'Président de chambre',
  COUNSELLOR: 'Conseiller',
  FIRST_PRESIDENT: 'Premier président',
  REFERENDARY_COUNSELLOR: 'Conseiller référendaire',
};

// the grades follow the scale of 01/12/2025, where G1 is the first and lowest grade. LOLFI still names many
// positions after the former scale, where II was the second and lowest grade and I the first
const LOLFI_POSITIONS: Record<
  CourtOfCassationPosition,
  { functionIds: string[]; gradeIds: string[] | null }
> = {
  AUDITOR_FIRST_GRADE: { functionIds: ['ACC'], gradeIds: ['G1', 'II'] },
  AUDITOR_SECOND_GRADE: { functionIds: ['ACC'], gradeIds: ['G2', 'I'] },
  CHAMBER_PRESIDENT: { functionIds: ['PC'], gradeIds: null },
  COUNSELLOR: { functionIds: ['C', EXTRAORDINARY_SERVICE_COUNSELLOR], gradeIds: null },
  FIRST_PRESIDENT: { functionIds: ['PP'], gradeIds: null },
  REFERENDARY_COUNSELLOR: { functionIds: ['CR'], gradeIds: null },
};

export function courtOfCassationPositions(): { id: CourtOfCassationPosition; label: string }[] {
  return COURT_OF_CASSATION_POSITIONS.map((id) => ({ id, label: LABELS[id] }));
}

/** the LOLFI positions of the positions asked, all of them when none is, ranked by the hierarchy, as parallel lists for SQL */
export function rankedLolfiPositions(positions: readonly CourtOfCassationPosition[]): RankedLolfiPositions {
  const rows = COURT_OF_CASSATION_POSITIONS.flatMap((position, rank) =>
    positions.length === 0 || positions.includes(position)
      ? LOLFI_POSITIONS[position].functionIds.flatMap((functionId) =>
          (LOLFI_POSITIONS[position].gradeIds ?? [null]).map((gradeId) => ({ functionId, gradeId, rank })),
        )
      : [],
  );

  return {
    functionIds: rows.map((row) => row.functionId),
    gradeIds: rows.map((row) => row.gradeId),
    ranks: rows.map((row) => row.rank),
  };
}

export function courtOfCassationPositionOfRank(rank: number): {
  id: CourtOfCassationPosition;
  label: string;
} {
  return courtOfCassationPositions()[rank]!;
}

const SERVICE_LABELS: Record<HolderService, string> = {
  EXTRAORDINARY: 'Service extraordinaire',
  ORDINARY: 'Service ordinaire',
};

export function holderServiceOf(functionId: string | null): { id: HolderService; label: string } {
  const id = functionId === EXTRAORDINARY_SERVICE_COUNSELLOR ? 'EXTRAORDINARY' : 'ORDINARY';
  return { id, label: SERVICE_LABELS[id] };
}
