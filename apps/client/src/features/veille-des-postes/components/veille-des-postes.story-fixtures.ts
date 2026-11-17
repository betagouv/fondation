import { http, HttpResponse } from 'msw';

import type { FoundPositionCommentDto, FoundPositionVacancyDto } from '@api/types';
import type {
  AlertDeadline,
  HolderAlert,
  HolderStatus,
  PositionAlert,
  PositionStatus,
  PositionVacancy,
  VacancyReason,
} from '@queries/veille-des-postes.queries';

type StoryRow = {
  alerts: HolderAlert[];
  status: HolderStatus;
};

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
/** the date of the vacancy declared for this retirement */
const REACHED_RETIREMENT: HolderAlert = {
  id: 'RETIREMENT',
  label: 'Âge limite de départ en retraite de 67 ans atteint le 05/01/2026',
  shortLabel: 'Âge limite atteint le 05/01/2026',
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
  [REACHED_RETIREMENT, 'WITHIN_SIX_MONTHS'],
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

type StoryVacancy = Pick<PositionVacancy, 'reasonDetail' | 'startDate'> & { reason: VacancyReason };

const REASONS: FoundPositionVacancyDto['reasons'] = [
  { detailRequired: false, id: 'DISCHARGE', label: 'Décharge' },
  { detailRequired: false, id: 'DEATH', label: 'Décès' },
  { detailRequired: false, id: 'DISCIPLINARY_DISMISSAL', label: 'Révocation disciplinaire' },
  { detailRequired: false, id: 'RETIREMENT', label: 'Retraite' },
  { detailRequired: false, id: 'STRIKING_OFF', label: 'Radiation' },
  { detailRequired: true, id: 'OTHER', label: 'Autre' },
];

/** the vacancies the stories start with: the side panel finds them by the status of their row */
const DECLARED_RETIREMENT = {
  status: { ...STATUSES[2], detail: 'Retraite depuis le 05/01/2026', hint: null },
  vacancy: { reason: 'RETIREMENT', reasonDetail: null, startDate: { day: 5, month: 1, year: 2026 } },
} satisfies { status: HolderStatus; vacancy: StoryVacancy };
const DECLARED_DETACHMENT = {
  status: {
    ...STATUSES[1],
    detail: 'Autre motif à compter du 01/03/2027',
    hint: 'Détachement au ministère de la Justice',
  },
  vacancy: {
    reason: 'OTHER',
    reasonDetail: 'Détachement au ministère de la Justice',
    startDate: { day: 1, month: 3, year: 2027 },
  },
} satisfies { status: HolderStatus; vacancy: StoryVacancy };

export function storyHolderOf(
  index: number,
  options: { held: boolean; movesAfterSevenYears: boolean },
): StoryRow {
  if (!options.held) return { alerts: [], status: { ...STATUSES[2], detail: null, hint: null } };

  const alerts = SAMPLES[index % SAMPLES.length]!.filter(
    ({ id }) => options.movesAfterSevenYears || id !== 'SEVEN_YEARS_ON_POSITION',
  );
  // now and then a vacancy declared by an agent with the alerts that go with it
  if (index % 9 === 4) return { alerts: [REACHED_RETIREMENT], status: DECLARED_RETIREMENT.status };
  if (index % 9 === 7) return { alerts: [], status: DECLARED_DETACHMENT.status };
  return { alerts, status: { ...(alerts.length > 0 ? STATUSES[1] : STATUSES[0]), detail: null, hint: null } };
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

const COMMENT_PATH = '*/api/veille-des-postes/v1/titulaires/:magistratId/commentaire';
const VACANCY_PATH = '*/api/veille-des-postes/v1/titulaires/:magistratId/vacance';
const ATTACHMENT_PATH = `${VACANCY_PATH}/pieces-jointes/:fileId`;

function reasonOf(id: VacancyReason): PositionVacancy['reason'] {
  const { label } = REASONS.find((reason) => reason.id === id)!;
  return { id, label };
}

/**
 * the side panel of the positions of a story as the API would answer it: the declared vacancies are kept
 * while the story runs and the tables keep their rows as they were
 */
export function positionVacancyHandlers(
  rows: readonly (StoryRow & { magistrat: { commentPreview?: string | null; id: string } | null })[],
): ReturnType<typeof http.get>[] {
  const writer = { id: 'story-user', name: 'Jess TEST' };
  const comments = new Map<string, NonNullable<FoundPositionCommentDto['comment']>>(
    rows.flatMap(({ magistrat }) =>
      magistrat?.commentPreview
        ? [
            [
              magistrat.id,
              { text: magistrat.commentPreview, updatedAt: '2026-11-10T09:30:00.000Z', updatedBy: writer },
            ] as const,
          ]
        : [],
    ),
  );
  const vacancies = new Map<string, PositionVacancy>(
    rows.flatMap((row) => {
      const declared = [DECLARED_DETACHMENT, DECLARED_RETIREMENT].find(({ status }) => status === row.status);
      if (!row.magistrat || !declared) return [];
      const vacancy: PositionVacancy = {
        ...declared.vacancy,
        attachments: [],
        reason: reasonOf(declared.vacancy.reason),
        updatedAt: '2026-11-10T09:30:00.000Z',
        updatedBy: writer,
      };
      return [[row.magistrat.id, vacancy] as const];
    }),
  );
  const found = (magistratId: string): FoundPositionVacancyDto => {
    const row = rows.find(({ magistrat }) => magistrat?.id === magistratId);
    const vacancy = vacancies.get(magistratId) ?? null;
    return {
      alerts: row?.alerts ?? [],
      detailMaxLength: 300,
      reasons: REASONS,
      startDateRange: { max: '2100-12-31', min: '2000-01-01' },
      // the status of the row as it was: the API computes it, the stories do not copy its rule
      status: row?.status ?? { ...STATUSES[0], detail: null, hint: null },
      vacancy,
    };
  };

  return [
    http.get(COMMENT_PATH, ({ params }) =>
      HttpResponse.json({
        comment: comments.get(String(params.magistratId)) ?? null,
        maxLength: 50_000,
      } satisfies FoundPositionCommentDto),
    ),
    // kept as sent: the API trims and erases. The stories do not copy its rule
    http.put(COMMENT_PATH, async ({ params, request }) => {
      const { comment } = (await request.json()) as { comment: string };
      comments.set(String(params.magistratId), {
        text: comment,
        updatedAt: new Date().toISOString(),
        updatedBy: writer,
      });

      return new HttpResponse(null, { status: 204 });
    }),
    http.get(VACANCY_PATH, ({ params }) => HttpResponse.json(found(String(params.magistratId)))),
    http.put(VACANCY_PATH, async ({ params, request }) => {
      const body = await request.formData();
      const form = JSON.parse(await (body.get('form') as Blob).text()) as {
        reason: VacancyReason;
        reasonDetail?: string | null;
        startDate: string;
      };
      const [year, month, day] = form.startDate.split('-').map(Number);
      const magistratId = String(params.magistratId);
      const added = body.getAll('files').map((file) => ({
        addedAt: new Date().toISOString(),
        addedBy: writer,
        id: crypto.randomUUID(),
        name: (file as File).name,
        size: (file as File).size,
      }));
      vacancies.set(magistratId, {
        attachments: [...added, ...(vacancies.get(magistratId)?.attachments ?? [])],
        reason: reasonOf(form.reason),
        reasonDetail: REASONS.find(({ id }) => id === form.reason)!.detailRequired
          ? (form.reasonDetail ?? null)
          : null,
        startDate: { day: day!, month: month!, year: year! },
        updatedAt: new Date().toISOString(),
        updatedBy: writer,
      });
      return new HttpResponse(null, { status: 204 });
    }),
    http.delete(VACANCY_PATH, ({ params }) => {
      vacancies.delete(String(params.magistratId));
      return new HttpResponse(null, { status: 204 });
    }),
    http.get(ATTACHMENT_PATH, ({ params }) =>
      HttpResponse.json({ id: String(params.fileId), name: 'justificatif.pdf', url: 'about:blank' }),
    ),
    http.patch(ATTACHMENT_PATH, async ({ params, request }) => {
      const { name } = (await request.json()) as { name: string };
      const vacancy = vacancies.get(String(params.magistratId));
      if (vacancy) {
        vacancy.attachments = vacancy.attachments.map((attachment) =>
          attachment.id === params.fileId
            ? { ...attachment, name: `${name}.${attachment.name.split('.').at(-1)}` }
            : attachment,
        );
      }
      return new HttpResponse(null, { status: 204 });
    }),
    http.delete(ATTACHMENT_PATH, ({ params }) => {
      const vacancy = vacancies.get(String(params.magistratId));
      if (vacancy) vacancy.attachments = vacancy.attachments.filter(({ id }) => id !== params.fileId);
      return new HttpResponse(null, { status: 204 });
    }),
  ];
}
