import type { Meta, StoryObj } from '@storybook/react-vite';

import { PageStory } from '@/shared/storybook/PageStory';
import { ROUTE_PATHS } from '@/utils/route-path.utils';
import { sessionKeys } from '@queries/nomination-sessions.queries';

import { SecretariatGeneralPage } from './SecretariatGeneralPage';

function SecretariatGeneralPageStory(props: { newSessionsCount: number }) {
  return (
    <PageStory
      key={props.newSessionsCount}
      location={ROUTE_PATHS.SG.DASHBOARD}
      path={ROUTE_PATHS.SG.DASHBOARD}
      seed={(client) =>
        client.setQueryData(sessionKeys.countUsersNewSessions(), { count: props.newSessionsCount })
      }
      view="sg"
    >
      <SecretariatGeneralPage />
    </PageStory>
  );
}

const meta = {
  args: { newSessionsCount: 2 },
  argTypes: { newSessionsCount: { control: { min: 0, type: 'number' } } },
  component: SecretariatGeneralPageStory,
  parameters: {
    docs: {
      description: {
        component:
          'Accueil du secrétariat général. Il choisit le pouvoir de proposition sur lequel travailler : le GDS ouvre la gestion des sessions et signale les nouvelles sessions, le CSM est en cours de développement et ne mène encore nulle part.',
      },
    },
    layout: 'fullscreen',
  },
  title: 'Pages/HomePage/SG',
} satisfies Meta<typeof SecretariatGeneralPageStory>;

export default meta;

export const Playground: StoryObj<typeof meta> = {};
