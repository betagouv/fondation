import type { QueryClient } from '@tanstack/react-query';

import type { DetailedNominationSessionDto } from '@api/types';
import { sessionKeys } from '@queries/nomination-sessions.queries';

export const STORY_SESSION_ID = 'session-1';

export const STORY_SESSION: DetailedNominationSessionDto = {
  date: { day: 20, month: 2, year: 2026 },
  dueDate: null,
  formation: 'SIEGE',
  id: STORY_SESSION_ID,
  isArchivable: false,
  isArchived: false,
  isDeletable: false,
  isValidated: true,
  name: 'Transparence annuelle',
  observationsClosingDate: { day: 27, month: 2, year: 2026 },
  outcomes: [],
  positionStartDate: null,
  typeDeSaisine: 'TRANSPARENCE_GDS',
};

export function seedStorySession(client: QueryClient) {
  client.setQueryData(sessionKeys.detailSession({ sessionId: STORY_SESSION_ID }), STORY_SESSION);
}
