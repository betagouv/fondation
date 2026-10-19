import type { Meta, StoryObj } from '@storybook/react-vite';
import { http, HttpResponse } from 'msw';

import type { RoleEnum } from '@/shared/enums/role.enum';
import { StoryQueryClient } from '@/shared/storybook/StoryQueryClient';
import type { ListedArchivedNominationSessionsDto } from '@api/types';

import { ArchivedSessionsTable } from './ArchivedSessionsTable';

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

const ROLES = [
  'ADJOINT_SECRETAIRE_GENERAL',
  'MEMBRE_COMMUN',
  'MEMBRE_DU_SIEGE',
  'MEMBRE_DU_PARQUET',
] as const satisfies readonly RoleEnum[];
type Role = (typeof ROLES)[number];

const FORMATIONS = {
  ADJOINT_SECRETAIRE_GENERAL: undefined,
  MEMBRE_COMMUN: undefined,
  MEMBRE_DU_PARQUET: 'PARQUET',
  MEMBRE_DU_SIEGE: 'SIEGE',
} satisfies Record<Role, ArchivedSession['formation'] | undefined>;

// the API keeps a member of a single formation to that formation: the handler reads the role of the
// story being rendered, as msw handlers are set once while the role changes with the controls
let memberFormation: ArchivedSession['formation'] | undefined;

const archivedSessionsHandler = http.get('*/api/archived-sessions/v1', ({ request }) => {
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

function ArchivedSessionsStory(props: { role: Role }) {
  memberFormation = FORMATIONS[props.role];

  return (
    <StoryQueryClient key={props.role}>
      <div className="fr-container fr-pt-8v fr-pb-16v">
        <ArchivedSessionsTable
          space={props.role === 'ADJOINT_SECRETAIRE_GENERAL' ? 'SG' : 'TRANSPARENCES'}
          withFormationFilter={!memberFormation}
        />
      </div>
    </StoryQueryClient>
  );
}

const meta = {
  args: { role: 'ADJOINT_SECRETAIRE_GENERAL' },
  argTypes: { role: { control: 'inline-radio', options: ROLES } },
  beforeEach: ({ msw }) => {
    msw.use(archivedSessionsHandler);
  },
  component: ArchivedSessionsStory,
  parameters: { layout: 'fullscreen' },
  title: 'Session/Transparence/ArchivedSessionsTable',
} satisfies Meta<typeof ArchivedSessionsStory>;

export default meta;

export const Playground: StoryObj<typeof meta> = {};
