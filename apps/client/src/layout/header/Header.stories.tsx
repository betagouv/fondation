import type { Meta, StoryObj } from '@storybook/react-vite';
import { http, HttpResponse } from 'msw';
import { generatePath, Route, Routes } from 'react-router';

import { ArchivedSessionContext } from '@/shared/context/archived-session';
import type { RoleEnum } from '@/shared/enums/role.enum';
import { POUVOIR_DE_PROPOSITION_STORAGE_KEY } from '@/shared/hooks/usePouvoirDeProposition';
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

const PAGES = ['home', 'archives', 'archivedSession', 'magistratSearch', 'veilleDesPostes'] as const;
type Page = (typeof PAGES)[number];

const SG_LOCATIONS = {
  archivedSession: generatePath(ROUTE_PATHS.SG.SESSION_ID, { sessionId: STORY_SESSION_ID }),
  archives: ROUTE_PATHS.SG.ARCHIVED_SESSIONS,
  home: ROUTE_PATHS.SG.DASHBOARD,
  magistratSearch: ROUTE_PATHS.SG.MAGISTRAT_SEARCH,
  veilleDesPostes: ROUTE_PATHS.SG.CSM.VEILLE_DES_POSTES_COURTS_OF_APPEAL,
} satisfies Record<Page, string>;

const MEMBER_LOCATIONS = {
  archivedSession: generatePath(ROUTE_PATHS.TRANSPARENCES.DETAIL_SESSION_GDS, {
    sessionId: STORY_SESSION_ID,
  }),
  archives: ROUTE_PATHS.TRANSPARENCES.ARCHIVED_SESSIONS,
  home: ROUTE_PATHS.TRANSPARENCES.DASHBOARD,
  magistratSearch: ROUTE_PATHS.MEMBER.MAGISTRAT_SEARCH,
  veilleDesPostes: ROUTE_PATHS.TRANSPARENCES.DASHBOARD,
} satisfies Record<Page, string>;

const OPENED_FROM = ['home', 'CSM', 'GDS'] as const;

function AppHeaderStory(props: { openedFrom: (typeof OPENED_FROM)[number]; page: Page; role: Role }) {
  // a common page follows the pouvoir it was opened from: the control sets it rather than the previous page shown
  if (props.openedFrom === 'home') sessionStorage.removeItem(POUVOIR_DE_PROPOSITION_STORAGE_KEY);
  else sessionStorage.setItem(POUVOIR_DE_PROPOSITION_STORAGE_KEY, props.openedFrom);
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
  args: { openedFrom: 'home', page: 'home', role: 'MEMBRE_DU_SIEGE' },
  argTypes: {
    openedFrom: { control: 'inline-radio', options: OPENED_FROM },
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
          'En-tête de l\'application. Un membre a une navigation avec "Accueil" (la liste de ses sessions), "Archives" (les sessions archivées de sa formation) et "Rechercher un magistrat". Le secrétariat général a la sienne, sans "Accueil" puisque le logo y mène. Hors d\'un pouvoir, elle se réduit à "Rechercher un magistrat" et au menu "Administration". Depuis le GDS, elle ajoute ses rubriques, avec une pastille sur "Gérer une session" quand de nouvelles sessions sont arrivées. Depuis le CSM, elle ajoute "Veille des postes", "Appels à candidature", "Processus de sélection" et "Membres". La page "veilleDesPostes" n\'existe que pour le secrétariat général : un membre y retrouve son accueil. "Rechercher un magistrat" est toujours seul à droite de la navigation. Une page d\'une session archivée met "Archives" en avant, quel que soit son chemin. Un administrateur a en plus le menu "Administration". En haut à droite, LOLFI, le centre d\'aide, l\'avis et le compte apparaissent pour tout le monde.',
      },
    },
    layout: 'fullscreen',
  },
  tags: ['autodocs'],
  title: 'Layout/Header',
} satisfies Meta<typeof AppHeaderStory>;

export default meta;

export const Playground: StoryObj<typeof meta> = {};
