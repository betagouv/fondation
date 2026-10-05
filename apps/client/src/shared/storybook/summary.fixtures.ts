import type { QueryClient } from '@tanstack/react-query';
import { http, HttpResponse } from 'msw';

import type {
  DetailedNominationSessionDto,
  DetailedSummaryDto,
  ListObservationsResponseDto,
} from '@api/types';
import { authKeys } from '@queries/auth.queries';
import { sessionKeys } from '@queries/nomination-sessions.queries';

export const SUMMARY_SESSION_ID = 'session-1';
export const SUMMARY_NOMINATION_FILE_ID = 'nomination-file-1';
export const SUMMARY_NOMINATION_FILE_WITHOUT_OBSERVATIONS_ID = 'nomination-file-2';

export const SUMMARY_VIEWS = ['sg', 'member'] as const;
export type SummaryView = (typeof SUMMARY_VIEWS)[number];

const USERS = {
  member: {
    civility: 'Monsieur PETIT',
    firstName: 'Jean',
    id: 'member-1',
    isImpersonated: false,
    lastName: 'Petit',
    role: 'MEMBRE_DU_SIEGE',
  },
  sg: {
    civility: 'Madame BERNARD',
    firstName: 'Sophie',
    id: 'sg-1',
    isImpersonated: false,
    lastName: 'Bernard',
    role: 'ADJOINT_SECRETAIRE_GENERAL',
  },
} satisfies Record<SummaryView, unknown>;

export const SUMMARY_AUTHOR = { firstName: 'Sophie', id: USERS.sg.id, lastName: 'Bernard' };

const SUMMARY_SESSION: DetailedNominationSessionDto = {
  date: { day: 20, month: 2, year: 2026 },
  dueDate: null,
  formation: 'SIEGE',
  id: SUMMARY_SESSION_ID,
  isArchivable: false,
  isArchived: false,
  isDeletable: false,
  isValidated: false,
  name: 'Transparence annuelle',
  observationsClosingDate: { day: 27, month: 2, year: 2026 },
  outcomes: [],
  positionStartDate: null,
  typeDeSaisine: 'TRANSPARENCE_GDS',
};

export function seedSummaryStory(client: QueryClient, view: SummaryView) {
  client.setQueryData(authKeys.introspectSession(), USERS[view]);
  client.setQueryData(sessionKeys.detailSession({ sessionId: SUMMARY_SESSION_ID }), SUMMARY_SESSION);
}

export const SUMMARY_ATTACHMENTS: DetailedSummaryDto['summary']['attachments'] = [
  {
    addedAt: '2026-06-01T08:30:00.000Z',
    addedBy: { id: USERS.sg.id, name: 'Sophie BERNARD' },
    id: 'attachment-1',
    name: 'PV - 01/06/2026 - Commission.pdf',
    size: 63_365,
    type: 'application/pdf',
  },
  {
    addedAt: '2026-06-02T14:10:00.000Z',
    addedBy: { id: 'user-2', name: 'Léa MARTIN' },
    id: 'attachment-2',
    name: 'entretien-camille-durand.docx',
    size: 24_576,
    type: 'application/msword',
  },
  {
    addedAt: '2026-06-03T09:45:00.000Z',
    addedBy: null,
    id: 'attachment-3',
    name: 'organigramme-juridiction.png',
    size: null,
    type: 'image/png',
  },
];

export const SUMMARY_OBSERVATIONS: ListObservationsResponseDto['observations'] = [
  {
    audition: null,
    createdAt: '2026-03-11',
    createdBy: { firstName: 'Anne', id: 'user-3', lastName: 'Roy' },
    dateReception: '2026-03-10',
    description: 'Le magistrat souligne plusieurs points de vigilance sur la proposition.',
    files: [
      {
        addedAt: '2026-03-11T08:30:00.000Z',
        addedBy: { id: 'user-3', name: 'Anne ROY' },
        id: 'observation-file-1',
        name: 'observation-syndicat.pdf',
        size: 120_000,
      },
      {
        addedAt: '2026-03-11T08:35:00.000Z',
        addedBy: null,
        id: 'observation-file-2',
        name: 'courrier-annexe.pdf',
        size: null,
      },
    ],
    followUp: 'ALERT',
    id: 'observation-1',
    magistrat: {
      currentPosition: 'Juge au tribunal judiciaire de Nantes',
      firstName: 'Léa',
      id: 'magistrat-martin',
      lastName: 'Martin',
      usedName: null,
    },
    observantObservationsCount: 1,
  },
  {
    audition: null,
    createdAt: '2026-03-12',
    createdBy: { firstName: 'Anne', id: 'user-3', lastName: 'Roy' },
    dateReception: '2026-03-12',
    description: '',
    files: [],
    followUp: null,
    id: 'observation-2',
    magistrat: null,
    observantObservationsCount: 1,
  },
];

export const summaryObservationsHandlers = [
  http.get('*/api/sessions/v2/:sessionId/files/:nominationFileId/observations', ({ params }) =>
    HttpResponse.json<ListObservationsResponseDto>({
      observations: params.nominationFileId === SUMMARY_NOMINATION_FILE_ID ? SUMMARY_OBSERVATIONS : [],
    }),
  ),
];

export function makeSummary(
  overrides: Partial<Omit<DetailedSummaryDto, 'summary'>> & {
    summary?: Partial<DetailedSummaryDto['summary']>;
  } = {},
): DetailedSummaryDto {
  const { summary, ...rest } = overrides;

  return {
    auditionDate: null,
    auditionExpected: false,
    auditionTime: null,
    biography:
      '- Juge au tribunal judiciaire de Lyon (2018)\n- Vice-présidente au tribunal judiciaire de Lyon (2021)\n- Conseillère référendaire à la Cour de cassation (2023)',
    birthDate: { day: 12, month: 4, year: 1978 },
    canScheduleAudition: true,
    detectedMagistratId: 'magistrat-1',
    grade: 'I',
    isArchived: false,
    lastPositionDate: { day: 1, month: 9, year: 2021 },
    missingEvaluation: false,
    name: 'Camille DURAND',
    observers: [],
    outcome: null,
    position: 'Juge au tribunal judiciaire de Lyon',
    priorities: [],
    rank: '12 sur 45',
    reportersMissing: false,
    targetedGrade: 'HH',
    targetedPosition: 'Conseillère à la cour d’appel de Paris',
    ...rest,
    summary: {
      attachments: [],
      author: SUMMARY_AUTHOR,
      content:
        '<p>Magistrate au parcours confirmé dont la candidature est portée par une expérience solide en juridiction, sur des fonctions civiles comme pénales.</p><h2>Points forts</h2><p>Les observations reçues soulignent une grande rigueur et un sens de l’écoute.</p>',
      readers: [],
      screenshots: [],
      ...summary,
    },
  };
}
