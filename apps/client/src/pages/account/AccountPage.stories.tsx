import type { Meta, StoryObj } from '@storybook/react-vite';
import { http, HttpResponse } from 'msw';

import { PageStory } from '@/shared/storybook/PageStory';
import { STORY_USERS, STORY_VIEWS, type StoryView } from '@/shared/storybook/story-users';
import { ROUTE_PATHS } from '@/utils/route-path.utils';
import { authKeys } from '@queries/auth.queries';

import { AccountPage } from './AccountPage';

const ANSWERS = ['CHANGED', 'WRONG_CURRENT_PASSWORD'] as const;

function AccountPageStory(props: {
  answer: (typeof ANSWERS)[number];
  isImpersonated: boolean;
  view: StoryView;
}) {
  return (
    <PageStory
      key={`${props.view}-${props.isImpersonated}`}
      location={ROUTE_PATHS.ACCOUNT}
      path={ROUTE_PATHS.ACCOUNT}
      seed={(client) =>
        client.setQueryData(authKeys.introspectSession(), {
          ...STORY_USERS[props.view],
          isImpersonated: props.isImpersonated,
          passwordChange: props.isImpersonated ? 'IMPERSONATED' : 'ALLOWED',
        })
      }
      view={props.view}
    >
      <AccountPage />
    </PageStory>
  );
}

const meta = {
  argTypes: {
    answer: { control: 'inline-radio', options: ANSWERS },
    view: { control: 'inline-radio', options: STORY_VIEWS },
  },
  args: { answer: 'CHANGED', isImpersonated: false, view: 'member' },
  beforeEach: ({ args, msw }) => {
    msw.use(
      http.put('*/api/auth/v2/password', () =>
        args.answer === 'CHANGED'
          ? new HttpResponse(null, { status: 204 })
          : HttpResponse.json({ validationError: 'Le mot de passe actuel est incorrect' }, { status: 400 }),
      ),
    );
  },
  component: AccountPageStory,
  parameters: {
    docs: {
      description: {
        component:
          "Page ouverte depuis le menu des initiales, dans l'en-tête. Les informations du compte se lisent sans se modifier : seul un administrateur les change. Changer son mot de passe ferme les autres sessions et garde celle-ci. Un administrateur connecté à la place d'un utilisateur ne peut pas changer son mot de passe.",
      },
    },
    layout: 'fullscreen',
  },
  title: 'Pages/Account',
} satisfies Meta<typeof AccountPageStory>;

export default meta;

export const Playground: StoryObj<typeof meta> = {};
