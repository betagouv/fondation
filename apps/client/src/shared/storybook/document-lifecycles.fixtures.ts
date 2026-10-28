import type { DetailedAgendaMetadata } from '@api/types';

import { STORY_AUTHORS } from './story-users';

export const DOCUMENT_VALIDATION = {
  at: '2026-09-22T08:12:00.000Z',
  by: { id: 'user-2', name: 'Lucas BERNARD' },
};

type DocumentLifecycle = Pick<
  DetailedAgendaMetadata,
  | 'canDiscardDraft'
  | 'canValidate'
  | 'draft'
  | 'draftChangesBy'
  | 'hasValidatedVersion'
  | 'status'
  | 'validation'
>;

// the agenda and the official report share their lifecycle, as the API tells it in their metadata
export const DOCUMENT_LIFECYCLES = {
  neverValidated: {
    canDiscardDraft: false,
    canValidate: true,
    draft: {
      openedAt: '2026-09-24T13:25:00.000Z',
      openedBy: STORY_AUTHORS.sg,
      systemCauses: [],
      systemUpdatedAt: null,
      updatedAt: '2026-09-24T14:02:00.000Z',
      updatedBy: STORY_AUTHORS.sg,
    },
    draftChangesBy: 'PERSON',
    hasValidatedVersion: false,
    status: 'DRAFT',
    validation: null,
  },
  validated: {
    canDiscardDraft: false,
    canValidate: false,
    draft: null,
    draftChangesBy: null,
    hasValidatedVersion: true,
    status: 'VALIDATED',
    validation: DOCUMENT_VALIDATION,
  },
  draftByPerson: {
    canDiscardDraft: true,
    canValidate: true,
    draft: {
      openedAt: '2026-09-24T13:25:00.000Z',
      openedBy: STORY_AUTHORS.sg,
      systemCauses: [],
      systemUpdatedAt: null,
      updatedAt: '2026-09-24T14:02:00.000Z',
      updatedBy: STORY_AUTHORS.sg,
    },
    draftChangesBy: 'PERSON',
    hasValidatedVersion: true,
    status: 'DRAFT',
    validation: DOCUMENT_VALIDATION,
  },
  draftBySystem: {
    canDiscardDraft: false,
    canValidate: true,
    draft: {
      openedAt: '2026-09-24T13:10:00.000Z',
      openedBy: null,
      systemCauses: ['AGENDA_TEXT', 'REPORTERS'],
      systemUpdatedAt: '2026-09-24T14:02:00.000Z',
      updatedAt: null,
      updatedBy: null,
    },
    draftChangesBy: 'SYSTEM',
    hasValidatedVersion: true,
    status: 'DRAFT',
    validation: DOCUMENT_VALIDATION,
  },
} satisfies Record<string, DocumentLifecycle>;
export type DocumentLifecycleName = keyof typeof DOCUMENT_LIFECYCLES;
