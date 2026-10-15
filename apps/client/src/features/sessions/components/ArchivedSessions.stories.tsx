import type { Meta, StoryObj } from '@storybook/react-vite';
import { http, HttpResponse } from 'msw';
import type { ComponentProps } from 'react';

import { StoryQueryClient } from '@/shared/storybook/StoryQueryClient';
import type { ListedArchivedNominationSessionsDto } from '@api/types';

import { ArchivedSessions } from './ArchivedSessions';

type ArchivedSession = ListedArchivedNominationSessionsDto['items'][number];

function archivedSession(props: Pick<ArchivedSession, 'archivedAt' | 'date' | 'formation' | 'id' | 'name'>) {
  return {
    ...props,
    proposingAuthority: { id: 'GARDE_DES_SCEAUX', label: 'Garde des Sceaux' },
    typeDeSaisine: { id: 'TRANSPARENCE_GDS', label: 'Transparence' },
  } satisfies ArchivedSession;
}

// already in the order of the API: the most recently archived first
const ARCHIVED_SESSIONS = [
  archivedSession({
    archivedAt: '2026-09-18T14:30:00.000Z',
    date: { day: 12, month: 6, year: 2026 },
    formation: 'SIEGE',
    id: 'session-1',
    name: 'Transparence du 12 juin 2026',
  }),
  archivedSession({
    archivedAt: '2026-07-02T09:00:00.000Z',
    date: { day: 3, month: 4, year: 2026 },
    formation: 'PARQUET',
    id: 'session-2',
    name: 'Transparence du 3 avril 2026',
  }),
  archivedSession({
    archivedAt: '2026-05-20T16:45:00.000Z',
    date: { day: 6, month: 2, year: 2026 },
    formation: 'SIEGE',
    id: 'session-3',
    name: 'Transparence annuelle 2026',
  }),
  archivedSession({
    archivedAt: '2026-01-15T11:00:00.000Z',
    date: { day: 10, month: 10, year: 2025 },
    formation: 'PARQUET',
    id: 'session-4',
    name: "Transparence d'automne 2025",
  }),
];

/** @param memberFormation as the API, which keeps a member of a single formation to that formation */
function makeArchivedSessionsHandler(memberFormation?: ArchivedSession['formation']) {
  return http.get('*/api/archived-sessions/v1', ({ request }) => {
    const params = new URL(request.url).searchParams;
    const formations = params.getAll('formations');
    const search = params.get('search')?.toLowerCase();

    const items = ARCHIVED_SESSIONS.filter(
      (session) =>
        (!memberFormation || session.formation === memberFormation) &&
        (formations.length === 0 || formations.includes(session.formation)) &&
        (!search || session.name.toLowerCase().includes(search)),
    );

    return HttpResponse.json<ListedArchivedNominationSessionsDto>({
      currentPageIndex: 1,
      items,
      totalCount: items.length,
    });
  });
}

function ArchivedSessionsStory(props: ComponentProps<typeof ArchivedSessions>) {
  return (
    <StoryQueryClient>
      <div className="fr-container fr-pt-8v fr-pb-16v">
        <ArchivedSessions {...props} />
      </div>
    </StoryQueryClient>
  );
}

const meta = {
  title: 'Session/ArchivedSessions',
  component: ArchivedSessionsStory,
  beforeEach: ({ msw }) => {
    msw.use(makeArchivedSessionsHandler());
  },
  parameters: { layout: 'fullscreen' },
  tags: ['autodocs'],
  argTypes: {
    space: { control: 'inline-radio', options: ['SG', 'TRANSPARENCES'] },
  },
} satisfies Meta<typeof ArchivedSessionsStory>;

export default meta;

type Story = StoryObj<typeof meta>;

export const SecretariatGeneral: Story = {
  args: { space: 'SG', withFormationFilter: true },
  parameters: { router: { initialEntries: ['/secretariat-general/archives/sessions'] } },
};

export const MemberOfFormation: Story = {
  args: { space: 'TRANSPARENCES', withFormationFilter: false },
  beforeEach: ({ msw }) => {
    msw.use(makeArchivedSessionsHandler('SIEGE'));
  },
  parameters: { router: { initialEntries: ['/transparences/archives/sessions'] } },
};

export const CommonMember: Story = {
  args: { space: 'TRANSPARENCES', withFormationFilter: true },
  parameters: { router: { initialEntries: ['/transparences/archives/sessions'] } },
};
