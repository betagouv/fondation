import type { Meta, StoryObj } from '@storybook/react-vite';
import { QueryClient } from '@tanstack/react-query';
import { http, HttpResponse } from 'msw';

import { StoryQueryClient } from '@/shared/storybook/StoryQueryClient';
import { authKeys } from '@queries/auth.queries';

import { AppHeader } from './Header';

const VIEWS = ['admin', 'member', 'sg'] as const;
type View = (typeof VIEWS)[number];

const ROLES = { admin: 'ADMIN', member: 'MEMBRE_COMMUN', sg: 'ADJOINT_SECRETAIRE_GENERAL' } as const;

function seed(view: View) {
  return (client: QueryClient) =>
    client.setQueryData(authKeys.introspectSession(), {
      civility: 'Madame MERCIER',
      firstName: 'Claire',
      id: `user-${view}`,
      isImpersonated: false,
      lastName: 'Mercier',
      role: ROLES[view],
    });
}

function AppHeaderStory(props: { view: View }) {
  return (
    <StoryQueryClient key={props.view} seed={seed(props.view)}>
      <AppHeader />
    </StoryQueryClient>
  );
}

const meta = {
  argTypes: { view: { control: 'inline-radio', options: VIEWS } },
  args: { view: 'member' },
  beforeEach: ({ msw }) => {
    msw.use(http.get('*/api/sessions/v2/new/count', () => HttpResponse.json({ count: 2 })));
  },
  component: AppHeaderStory,
  parameters: {
    docs: {
      description: {
        component:
          'En-tête de l\'application. Un membre n\'a pas de menu de navigation. Le secrétariat général a le sien, avec une pastille sur "Gérer une session" quand de nouvelles sessions sont arrivées. Un administrateur a en plus le menu "Administration". En haut à droite, LOLFI, le centre d\'aide, l\'avis et le compte apparaissent pour tout le monde.',
      },
    },
    layout: 'fullscreen',
    router: { initialEntries: ['/secretariat-general'], path: '*' },
  },
  tags: ['autodocs'],
  title: 'Layout/Header',
} satisfies Meta<typeof AppHeaderStory>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Member: Story = {};

export const Sg: Story = { args: { view: 'sg' } };

export const Admin: Story = { args: { view: 'admin' } };
