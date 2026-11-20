import type { Meta, StoryObj } from '@storybook/react-vite';
import { http, HttpResponse } from 'msw';
import { Route, Routes } from 'react-router';

import { ArchivedSessionContext } from '@/shared/context/archived-session';
import { STORY_USERS } from '@/shared/storybook/story-users';
import { StoryQueryClient } from '@/shared/storybook/StoryQueryClient';
import { ROUTE_PATHS } from '@/utils/route-path.utils';
import { authKeys, type SessionUser } from '@queries/auth.queries';

import { AppHeader } from './Header';

const USERS = {
  admin: { ...STORY_USERS.sg, isAdmin: true },
  member: STORY_USERS.member,
  secretariat: STORY_USERS.sg,
} satisfies Record<string, SessionUser>;
type Role = keyof typeof USERS;

const SG_LOCATIONS = {
  CSM: ROUTE_PATHS.SG.CSM.VEILLE_DES_POSTES_COURTS_OF_APPEAL,
  GDS: ROUTE_PATHS.SG.GDS.MANAGE_SESSION,
  none: ROUTE_PATHS.SG.DASHBOARD,
};
type Pouvoir = keyof typeof SG_LOCATIONS;

function AppHeaderStory(props: { pouvoir: Pouvoir; role: Role }) {
  const location =
    props.role === 'member' ? ROUTE_PATHS.TRANSPARENCES.DASHBOARD : SG_LOCATIONS[props.pouvoir];

  return (
    <StoryQueryClient
      key={props.role}
      seed={(client) => client.setQueryData(authKeys.introspectSession(), USERS[props.role])}
    >
      <ArchivedSessionContext value={{ isArchived: false, setIsArchived: () => {} }}>
        <Routes location={location}>
          <Route element={<AppHeader />} path="*" />
        </Routes>
      </ArchivedSessionContext>
    </StoryQueryClient>
  );
}

const meta = {
  args: { pouvoir: 'GDS', role: 'secretariat' },
  argTypes: {
    pouvoir: {
      control: 'inline-radio',
      if: { arg: 'role', neq: 'member' },
      options: Object.keys(SG_LOCATIONS),
    },
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
          'En-tête de l\'application. Un membre a une navigation avec "Accueil" (la liste de ses sessions), "Archives" (les sessions archivées de sa formation) et "Rechercher un magistrat". Le secrétariat général a la sienne, sans "Accueil" puisque le logo y mène, et qui suit le pouvoir où il travaille. Hors d\'un pouvoir, elle se réduit à "Rechercher un magistrat". Dans le GDS, elle ajoute ses rubriques, avec une pastille sur "Gérer une session" quand de nouvelles sessions sont arrivées. Dans le CSM, elle ajoute "Veille des postes". "Rechercher un magistrat" est toujours seul à droite de la navigation. Un administrateur a en plus le menu "Administration". En haut à droite, LOLFI, le centre d\'aide, l\'avis et le compte apparaissent pour tout le monde.',
      },
    },
    layout: 'fullscreen',
  },
  tags: ['autodocs'],
  title: 'Layout/Header',
} satisfies Meta<typeof AppHeaderStory>;

export default meta;

export const Playground: StoryObj<typeof meta> = {};
