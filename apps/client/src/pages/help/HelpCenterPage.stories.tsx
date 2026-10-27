import type { Meta, StoryObj } from '@storybook/react-vite';

import { AdminHelpPage } from '@/pages/spaces/admin/AdminHelpPage';
import { HELP_PAGE_STATES, type HelpPageState, helpPageHandlers } from '@/shared/storybook/help.fixtures';
import { PageStory } from '@/shared/storybook/PageStory';
import { STORY_VIEWS } from '@/shared/storybook/story-users';
import { ROUTE_PATHS } from '@/utils/route-path.utils';

import { HelpCenterPage } from './HelpCenterPage';

const VIEWS = [...STORY_VIEWS, 'admin'] as const;
type View = (typeof VIEWS)[number];

function HelpCenterPageStory(props: { state: HelpPageState; view: View }) {
  if (props.view === 'admin') {
    return (
      <PageStory key={props.state} location={ROUTE_PATHS.ADMIN.HELP} path={ROUTE_PATHS.ADMIN.HELP} view="sg">
        <AdminHelpPage />
      </PageStory>
    );
  }

  return (
    <PageStory key={props.state} location={ROUTE_PATHS.HELP} path={ROUTE_PATHS.HELP} view={props.view}>
      <HelpCenterPage />
    </PageStory>
  );
}

const meta = {
  args: { state: 'WRITTEN', view: 'sg' },
  argTypes: {
    state: { control: 'inline-radio', options: HELP_PAGE_STATES },
    view: { control: 'inline-radio', options: VIEWS },
  },
  beforeEach: ({ args, msw }) => {
    msw.use(...helpPageHandlers(args.state));
  },
  component: HelpCenterPageStory,
  parameters: {
    docs: {
      description: {
        component:
          "Le centre d'aide, lu depuis le bouton de l'en-tête (sg, member) : la page de l'espace de la personne connectée, dont les titres forment le sommaire latéral. Une page jamais rédigée (BLANK) le dit, sans sommaire. L'administrateur (admin) rédige les deux pages depuis l'espace Administration, une par onglet : enregistrement à la demande, brouillon retenu sur sa page, aperçu tel que les lecteurs verront la page. Une capture ou une vidéo ajoutée au texte est lue depuis la mémoire du navigateur.",
      },
    },
    layout: 'fullscreen',
  },
  title: 'Pages/HelpCenter',
} satisfies Meta<typeof HelpCenterPageStory>;

export default meta;

export const Playground: StoryObj<typeof meta> = {};
