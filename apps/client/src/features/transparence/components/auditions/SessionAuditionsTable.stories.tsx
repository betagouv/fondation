import type { Meta, StoryObj } from '@storybook/react-vite';
import { http, HttpResponse } from 'msw';

import { sgAuthHandlers } from '@/shared/storybook/msw.handlers';
import { STORY_VIEWS, type StoryView } from '@/shared/storybook/story-users';
import { StoryQueryClient } from '@/shared/storybook/StoryQueryClient';
import { ToastProvider } from '@/shared/ui/toast';
import type {
  CountedSessionAuditionsDto,
  DetailedAuditionsPublicationDto,
  ListedSessionAuditionsDto,
} from '@api/types';

import { SessionAuditionsTable } from './SessionAuditionsTable';

type Auditions = ListedSessionAuditionsDto['items'];

const AT_NINE = { date: { day: 12, month: 12, year: 2028 }, time: { hours: 9, minutes: 30, seconds: 0 } };

const AUDITIONS: Auditions = [
  {
    audition: AT_NINE,
    contact: { email: 'marie-helene.de-la-rochefoucauld@justice.fr', phoneNumber: null },
    id: 'PROPOSED-file-1',
    magistrat: {
      currentPosition: 'Présidente du tribunal judiciaire de VALENCIENNES',
      id: 'magistrat-1',
      name: 'DE LA ROCHEFOUCAULD-MONTMORENCY Marie-Hélène Bérénice',
    },
    propositions: [
      { label: 'HH - Première présidente CA DOUAI', nominationFileId: 'file-1', observationId: null },
    ],
    reporters: [{ firstName: 'Rachel', id: 'user-2', lastName: 'Bernard' }],
    role: 'PROPOSED',
  },
  {
    audition: null,
    contact: { email: null, phoneNumber: { label: null, number: '01 02 03 04 05' } },
    id: 'PROPOSED-file-2',
    magistrat: {
      currentPosition: 'Procureur de la République TJ LILLE',
      id: 'magistrat-2',
      name: 'KOFFI Aminata',
    },
    propositions: [
      { label: 'HH - Procureur général CA AMIENS', nominationFileId: 'file-2', observationId: null },
    ],
    reporters: [],
    role: 'PROPOSED',
  },
];

const sessions: Record<string, Auditions> = { empty: [], few: AUDITIONS };

type PublicationStatus = DetailedAuditionsPublicationDto['status'];

// beforeEach only runs once: a control reaches the handlers through the session id, not through the args
function storySession(sessionId: unknown): { items: Auditions; status: PublicationStatus } {
  const [list, status] = String(sessionId).split('.');
  return { items: sessions[list ?? ''] ?? [], status: (status ?? 'NEVER_PUBLISHED') as PublicationStatus };
}

const auditionsHandlers = [
  http.get('*/api/sessions/v2/:sessionId/auditions', ({ params }) => {
    const { items } = storySession(params.sessionId);
    return HttpResponse.json<ListedSessionAuditionsDto>({
      currentPageIndex: 1,
      items,
      totalCount: items.length,
    });
  }),
  http.get('*/api/sessions/v2/:sessionId/auditions/counts', ({ params }) => {
    const { items } = storySession(params.sessionId);
    const scheduled = items.filter(({ audition }) => audition).length;
    return HttpResponse.json<CountedSessionAuditionsDto>({ scheduled, toSchedule: items.length - scheduled });
  }),
  http.get('*/api/sessions/v2/:sessionId/auditions/publications/last', ({ params }) => {
    const { status } = storySession(params.sessionId);
    return HttpResponse.json<DetailedAuditionsPublicationDto>({
      lastPublished:
        status === 'PUBLISHED' || status === 'UNPUBLISHED_CHANGES'
          ? { at: '2028-12-01T09:30:00.000Z', by: { id: 'user-sg', name: 'Claire Mercier' } }
          : null,
      status,
    });
  }),
];

function SessionAuditionsTableStory(props: {
  publicationStatus: PublicationStatus;
  sessionId: string;
  view: StoryView;
}) {
  const sessionId = `${props.sessionId}.${props.publicationStatus}`;

  return (
    <StoryQueryClient key={`${sessionId}-${props.view}`}>
      <ToastProvider>
        <SessionAuditionsTable
          canManage={props.view === 'sg'}
          context={props.view === 'sg' ? 'sg' : 'membre'}
          filtersSlot={null}
          formation="PARQUET"
          outcomes={[]}
          sessionId={sessionId}
          toolbarSlot={null}
        />
      </ToastProvider>
    </StoryQueryClient>
  );
}

const meta = {
  args: { publicationStatus: 'UNPUBLISHED_CHANGES', sessionId: 'few', view: 'sg' },
  argTypes: {
    publicationStatus: {
      control: 'inline-radio',
      options: ['NEVER_PUBLISHED', 'NOTHING_TO_PUBLISH', 'PUBLISHED', 'UNPUBLISHED_CHANGES'],
    },
    sessionId: { control: 'inline-radio', options: Object.keys(sessions) },
    view: { control: 'inline-radio', options: STORY_VIEWS },
  },
  beforeEach: ({ msw }) => {
    msw.use(...sgAuthHandlers, ...auditionsHandlers);
  },
  component: SessionAuditionsTableStory,
  parameters: { layout: 'padded' },
  title: 'Session/GDS/SessionAuditionsTable',
} satisfies Meta<typeof SessionAuditionsTableStory>;

export default meta;

export const Playground: StoryObj<typeof meta> = {};
