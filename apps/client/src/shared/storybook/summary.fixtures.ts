import { http, HttpResponse } from 'msw';

import type { DetailedSummaryDto, ListObservationsResponseDto } from '@api/types';

import { STORY_AUTHORS, STORY_USERS } from './story-users';

export const SUMMARY_NOMINATION_FILE_ID = 'nomination-file-1';

const SUMMARY_AUTHOR = { firstName: 'Sophie', id: STORY_USERS.sg.id, lastName: 'Bernard' };

export const SUMMARY_ATTACHMENTS: DetailedSummaryDto['summary']['attachments'] = [
  {
    addedAt: '2026-06-01T08:30:00.000Z',
    addedBy: STORY_AUTHORS.sg,
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

const SUMMARY_OBSERVATIONS: ListObservationsResponseDto['observations'] = [
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
      name: 'MARTIN Léa',
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
  http.get('*/api/sessions/v2/:sessionId/files/:nominationFileId/observations', () =>
    HttpResponse.json<ListObservationsResponseDto>({ observations: SUMMARY_OBSERVATIONS }),
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
    auditionRequired: false,
    auditionRequirement: null,
    auditionTime: null,
    biography:
      '- Juge au tribunal judiciaire de Lyon (2018) - Vice-présidente au tribunal judiciaire de Lyon (2021) - Conseillère référendaire à la Cour de cassation (2023)',
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
      canWrite: true,
      content:
        '<p>Magistrate au parcours confirmé dont la candidature est portée par une expérience solide en juridiction, sur des fonctions civiles comme pénales.</p><h2>Points forts</h2><p>Les observations reçues soulignent une grande rigueur et un sens de l’écoute.</p>',
      readers: [],
      screenshots: [],
      ...summary,
    },
  };
}
