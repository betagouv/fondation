import type {
  AlertDeadline,
  HolderAlert,
  PositionAlert,
  PositionStatus,
} from '@queries/veille-des-postes.queries';

type StoryRow = { alerts: HolderAlert[]; status: { id: PositionStatus; label: string } };

const STATUSES = [
  { id: 'OCCUPIED', label: 'Occupé' },
  { id: 'MAY_BECOME_VACANT', label: 'Susceptible de devenir vacant' },
  { id: 'VACANT', label: 'Vacant' },
] as const satisfies readonly { id: PositionStatus; label: string }[];
const ALERTS = [
  { id: 'RETIREMENT', label: 'Départ en retraite prévisionnel' },
  { id: 'SEVEN_YEARS_ON_POSITION', label: 'Mouvement obligatoire après 7 ans' },
  { id: 'PROPOSED_IN_SESSION', label: 'Magistrat proposé sur une session en cours' },
] as const satisfies readonly { id: PositionAlert; label: string }[];
const DEADLINES = [
  { id: 'WITHIN_SIX_MONTHS', label: '6 prochains mois' },
  { id: 'WITHIN_TWELVE_MONTHS', label: '12 prochains mois' },
] as const satisfies readonly { id: AlertDeadline; label: string }[];

const RETIREMENT: HolderAlert = {
  id: 'RETIREMENT',
  label: 'Départ en retraite prévisionnel à 67 ans à partir du 01/03/2027',
  shortLabel: 'Retraite le 01/03/2027',
};
const LATER_RETIREMENT: HolderAlert = {
  id: 'RETIREMENT',
  label: 'Départ en retraite prévisionnel à 67 ans à partir du 01/09/2027',
  shortLabel: 'Retraite le 01/09/2027',
};
const PAST_RETIREMENT: HolderAlert = {
  id: 'RETIREMENT',
  label: 'Âge limite de départ en retraite de 67 ans atteint le 07/10/2024',
  shortLabel: 'Âge limite atteint le 07/10/2024',
};
const SEVEN_YEARS: HolderAlert = {
  id: 'SEVEN_YEARS_ON_POSITION',
  label: 'En poste depuis plus de 7 ans à partir du 01/02/2027',
  shortLabel: '7 ans en poste le 01/02/2027',
};
const PROPOSAL: HolderAlert = {
  id: 'PROPOSED_IN_SESSION',
  label:
    'Proposé sur le poste "Premier président CA  LYON" de la session "Transparence de décembre" du 10/12/2026',
  shortLabel: 'Proposé en session du 10/12/2026',
};
const DEADLINES_OF = new Map<HolderAlert, AlertDeadline>([
  [LATER_RETIREMENT, 'WITHIN_TWELVE_MONTHS'],
  [PAST_RETIREMENT, 'WITHIN_SIX_MONTHS'],
  [PROPOSAL, 'WITHIN_SIX_MONTHS'],
  [RETIREMENT, 'WITHIN_SIX_MONTHS'],
  [SEVEN_YEARS, 'WITHIN_SIX_MONTHS'],
]);
const SAMPLES: HolderAlert[][] = [
  [],
  [],
  [RETIREMENT],
  [PAST_RETIREMENT],
  [LATER_RETIREMENT],
  [],
  [SEVEN_YEARS],
  [PROPOSAL, RETIREMENT],
];

export function storyHolderOf(
  index: number,
  options: { held: boolean; movesAfterSevenYears: boolean },
): StoryRow {
  if (!options.held) return { alerts: [], status: STATUSES[2] };

  const alerts = SAMPLES[index % SAMPLES.length]!.filter(
    ({ id }) => options.movesAfterSevenYears || id !== 'SEVEN_YEARS_ON_POSITION',
  );
  return { alerts, status: alerts.length > 0 ? STATUSES[1] : STATUSES[0] };
}

export function storyCountOf<Row>(rows: Row[], valuesOf: (row: Row) => string[], id: string): number {
  return rows.filter((row) => valuesOf(row).includes(id)).length;
}

/** fixed counts over every row: the stories show the table, the API filters and counts */
export function storyCounts<Row extends StoryRow>(rows: Row[]) {
  return {
    alerts: ALERTS.map((alert) => ({
      ...alert,
      count: storyCountOf(rows, (row) => row.alerts.map(({ id }) => id), alert.id),
    })),
    deadlines: DEADLINES.map((deadline) => ({
      ...deadline,
      count: storyCountOf(rows, (row) => row.alerts.flatMap(deadlinesOf), deadline.id),
    })),
    statuses: STATUSES.map((status) => ({
      ...status,
      count: storyCountOf(rows, (row) => [row.status.id], status.id),
    })),
  };
}

function deadlinesOf(alert: HolderAlert): AlertDeadline[] {
  return DEADLINES_OF.get(alert) === 'WITHIN_SIX_MONTHS'
    ? DEADLINES.map(({ id }) => id)
    : ['WITHIN_TWELVE_MONTHS'];
}
