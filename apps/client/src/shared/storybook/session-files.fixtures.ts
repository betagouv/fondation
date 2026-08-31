import { makeSessionNominationFile } from '@/test-utils/factories/session-nomination-file.factory';
import type { ListedMemberSessionReportsDto, PaginatedMemberListItemDto } from '@api/types';

/** `user-1` is the member logged in by `authHandlers` so the member view shows their own reports */
export const sessionReporters = {
  bernard: { id: 'user-2', firstName: 'Rachel', lastName: 'Bernard' },
  lemoine: { id: 'user-1', firstName: 'Nadia', lastName: 'Lemoine' },
  roche: { id: 'user-3', firstName: 'Antoine', lastName: 'Roche' },
};

export const sessionFiles = [
  makeSessionNominationFile({
    content: {
      grade: 'I',
      gradeCible: 'HH',
      nomMagistrat: 'KOFFI Aminata',
      numeroDeDossier: 1,
      outcome: { comment: null, value: 'WAITING_DSJ' },
      posteActuel: 'Présidente du tribunal judiciaire de VALENCIENNES',
      posteCible: 'Première présidente CA DOUAI',
      status: { value: 'DSJ_PLANNED', dates: [{ year: 2026, month: 6, day: 1 }] },
    },
    hasAttachment: true,
    id: 'dossier-1',
    reporters: [sessionReporters.bernard, sessionReporters.lemoine],
  }),

  makeSessionNominationFile({
    content: {
      grade: 'I',
      gradeCible: 'HH',
      nomMagistrat: 'VALROSE Honorine',
      numeroDeDossier: 2,
      outcome: { comment: null, value: 'VALIDATED' },
      posteActuel: 'Conseillère à la cour d’appel de Lyon',
      posteCible: 'Président de chambre CA AIX EN PROVENCE',
      status: { value: 'DSJ_REPORTED', dates: [{ year: 2026, month: 6, day: 8 }] },
    },
    id: 'dossier-2',
    priorities: ['ETOILE'],
    reporters: [sessionReporters.bernard, sessionReporters.roche],
  }),

  makeSessionNominationFile({
    content: {
      grade: 'II',
      gradeCible: 'I',
      nomMagistrat: 'AUBRY Gaspard',
      numeroDeDossier: 3,
      observants: ['CSM'],
      posteActuel: 'Juge au tribunal judiciaire de Poitiers',
      posteCible: 'Juge au tribunal judiciaire de BORDEAUX',
      status: { value: 'DSJ_PLANNED', dates: [{ year: 2026, month: 6, day: 1 }] },
    },
    id: 'dossier-3',
    priorities: ['OUTRE_MER'],
    reporters: [sessionReporters.lemoine],
  }),

  makeSessionNominationFile({
    content: {
      grade: 'II',
      gradeCible: 'II',
      nomMagistrat: 'BENALI Sofia',
      numeroDeDossier: 4,
      outcome: { comment: 'Le profil ne correspond pas au poste.', value: 'NON_VALIDATED' },
      posteActuel: 'Substitut du procureur TJ AMIENS',
      posteCible: 'Substitut du procureur TJ LILLE',
      status: { value: 'TO_REPORT', dates: [] },
    },
    id: 'dossier-4',
    reporters: [sessionReporters.roche, sessionReporters.lemoine],
  }),

  makeSessionNominationFile({
    content: {
      grade: 'I',
      gradeCible: 'G3',
      nomMagistrat: 'PEREIRA Lucas',
      numeroDeDossier: 5,
      posteActuel: 'Vice-président TJ TOULON',
      posteCible: 'Premier vice-président TJ MARSEILLE',
      status: { value: 'TO_REPORT', dates: [] },
    },
    id: 'dossier-5',
    reporters: [],
  }),

  makeSessionNominationFile({
    content: {
      grade: 'I',
      gradeCible: 'G2',
      nomMagistrat: 'DELAUNAY Mathis',
      numeroDeDossier: 6,
      posteActuel: 'Juge des enfants TJ RENNES',
      posteCible: 'Vice-président TJ NANTES',
      status: { value: 'TO_REPORT', dates: [] },
    },
    id: 'dossier-6',
    missingEvaluation: true,
    priorities: ['PROFILE'],
    reporters: [],
  }),
];

export const sessionMembers: PaginatedMemberListItemDto['items'] = [
  {
    ...sessionReporters.bernard,
    excludedJurisdictions: [{ id: 'jurisdiction-1', label: 'CA AIX EN PROVENCE' }],
    role: 'MEMBRE_DU_SIEGE',
    stats: [],
  },
];

export const sessionMemberReports: ListedMemberSessionReportsDto['items'] = [
  { nominationFileId: 'dossier-1', report: { id: 'report-1', state: 'READY_TO_SUPPORT' } },
  { nominationFileId: 'dossier-3', report: { id: 'report-2', state: 'IN_PROGRESS' } },
  { nominationFileId: 'dossier-4', report: { id: 'report-3', state: 'SUPPORTED' } },
];
