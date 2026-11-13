import type {
  AlertDeadline,
  HolderAlert,
  PositionAlert,
  PositionStatus,
} from '@queries/veille-des-postes.queries';

type StoryRow = { alerts: HolderAlert[]; status: { id: PositionStatus; label: string } };
type StoryFacet<Row> = [asked: string[], valuesOf: (row: Row) => string[]];

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

/** filters and counts the rows as the API does: each facet under the others, not under its own */
export function storyFacets<Row extends StoryRow>(
  rows: Row[],
  params: URLSearchParams,
  others: Record<string, StoryFacet<Row>> = {},
) {
  const deadlinesOf = (alert: HolderAlert) =>
    DEADLINES_OF.get(alert) === 'WITHIN_SIX_MONTHS'
      ? DEADLINES.map(({ id }) => id)
      : ['WITHIN_TWELVE_MONTHS'];
  const asked: Record<string, string[]> = {
    alert: params.getAll('alerts'),
    deadline: params.getAll('deadlines'),
    status: params.getAll('statuses'),
    ...Object.fromEntries(Object.entries(others).map(([key, [otherAsked]]) => [key, otherAsked])),
  };
  // the alert and its deadline go together, as in the API
  const valuesOf = (ofAsked: Record<string, string[]>): Record<string, (row: Row) => string[]> => ({
    alert: (row) =>
      row.alerts
        .filter(
          (alert) =>
            ofAsked.deadline!.length === 0 || deadlinesOf(alert).some((d) => ofAsked.deadline!.includes(d)),
        )
        .map(({ id }) => id),
    deadline: (row) => [
      ...new Set(
        row.alerts
          .filter((alert) => ofAsked.alert!.length === 0 || ofAsked.alert!.includes(alert.id))
          .flatMap(deadlinesOf),
      ),
    ],
    status: (row) => [row.status.id],
    ...Object.fromEntries(Object.entries(others).map(([key, [, otherValuesOf]]) => [key, otherValuesOf])),
  });
  const matchesAll = (row: Row, values: Record<string, (row: Row) => string[]>, except?: string) =>
    Object.keys(asked).every(
      (key) =>
        key === except || asked[key]!.length === 0 || values[key]!(row).some((v) => asked[key]!.includes(v)),
    );
  const count = (key: string, id: string) => {
    const values = valuesOf({ ...asked, [key]: [] });
    return rows.filter((row) => matchesAll(row, values, key) && values[key]!(row).includes(id)).length;
  };
  const values = valuesOf(asked);

  return {
    count,
    counts: {
      alerts: ALERTS.map((alert) => ({ ...alert, count: count('alert', alert.id) })),
      deadlines: DEADLINES.map((deadline) => ({ ...deadline, count: count('deadline', deadline.id) })),
      statuses: STATUSES.map((status) => ({ ...status, count: count('status', status.id) })),
    },
    matching: rows.filter((row) => matchesAll(row, values)),
  };
}
