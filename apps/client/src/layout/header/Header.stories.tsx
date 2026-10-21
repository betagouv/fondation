import type { Meta, StoryObj } from '@storybook/react-vite';
import { http, HttpResponse } from 'msw';
import { generatePath, Route, Routes } from 'react-router';

import { ArchivedSessionContext } from '@/shared/context/archived-session';
import type { RoleEnum } from '@/shared/enums/role.enum';
import { STORY_SESSION_ID } from '@/shared/storybook/story-session';
import { STORY_USERS } from '@/shared/storybook/story-users';
import { StoryQueryClient } from '@/shared/storybook/StoryQueryClient';
import { ROUTE_PATHS } from '@/utils/route-path.utils';
import { authKeys, type SessionUser } from '@queries/auth.queries';

import { AppHeader } from './Header';

const USERS = {
  ADJOINT_SECRETAIRE_GENERAL: STORY_USERS.sg,
  ADMIN: { ...STORY_USERS.sg, isAdmin: true },
  MEMBRE_DU_SIEGE: STORY_USERS.member,
} satisfies Partial<Record<'ADMIN' | RoleEnum, SessionUser>>;
type Role = keyof typeof USERS;

const PAGES = ['home', 'archives', 'archivedSession', 'magistratSearch'] as const;
type Page = (typeof PAGES)[number];

const SG_LOCATIONS = {
  archivedSession: generatePath(ROUTE_PATHS.SG.SESSION_ID, { sessionId: STORY_SESSION_ID }),
  archives: ROUTE_PATHS.SG.ARCHIVED_SESSIONS,
  home: ROUTE_PATHS.SG.DASHBOARD,
  magistratSearch: ROUTE_PATHS.SG.MAGISTRAT_SEARCH,
} satisfies Record<Page, string>;

const MEMBER_LOCATIONS = {
  archivedSession: generatePath(ROUTE_PATHS.TRANSPARENCES.DETAIL_SESSION_GDS, {
    sessionId: STORY_SESSION_ID,
  }),
  archives: ROUTE_PATHS.TRANSPARENCES.ARCHIVED_SESSIONS,
  home: ROUTE_PATHS.TRANSPARENCES.DASHBOARD,
  magistratSearch: ROUTE_PATHS.MEMBER.MAGISTRAT_SEARCH,
} satisfies Record<Page, string>;

function AppHeaderStory(props: { page: Page; role: Role }) {
  const locations = props.role === 'MEMBRE_DU_SIEGE' ? MEMBER_LOCATIONS : SG_LOCATIONS;

  return (
    <StoryQueryClient
      key={props.role}
      seed={(client) => client.setQueryData(authKeys.introspectSession(), USERS[props.role])}
    >
      <ArchivedSessionContext
        value={{ isArchived: props.page === 'archivedSession', setIsArchived: () => {} }}
      >
        <Routes location={locations[props.page]}>
          <Route element={<AppHeader />} path="*" />
        </Routes>
      </ArchivedSessionContext>
    </StoryQueryClient>
  );
}

const meta = {
  args: { page: 'home', role: 'MEMBRE_DU_SIEGE' },
  argTypes: {
    page: { control: 'inline-radio', options: PAGES },
    role: { control: 'inline-radio', options: Object.keys(USERS) },
  },
  beforeEach: ({ msw }) => {
    msw.use(http.get('*/api/sessions/v2/new/count', () => HttpResponse.json({ count: 2 })));
  },
  component: AppHeaderStory,
  parameters: {
    docs: {
      description: {
        component:
          'En-tête de l\'application. Un membre a une navigation avec "Accueil" (la liste de ses sessions), "Archives" (les sessions archivées de sa formation) et "Rechercher un magistrat". Le secrétariat général a la sienne, avec une pastille sur "Gérer une session" quand de nouvelles sessions sont arrivées et "Rechercher un magistrat" après "Archives". Une page d\'une session archivée met "Archives" en avant, quel que soit son chemin. Un administrateur a en plus le menu "Administration". En haut à droite, LOLFI, le centre d\'aide, l\'avis et le compte apparaissent pour tout le monde.',
      },
    },
    layout: 'fullscreen',
  },
  tags: ['autodocs'],
  title: 'Layout/Header',
} satisfies Meta<typeof AppHeaderStory>;

export default meta;

export const Playground: StoryObj<typeof meta> = {};
