import type { Meta, StoryObj } from '@storybook/react-vite';
import { http, HttpResponse } from 'msw';
import { generatePath } from 'react-router';

import { PageStory } from '@/shared/storybook/PageStory';
import { ROUTE_PATHS } from '@/utils/route-path.utils';
import type { DetailedAdminUserDto } from '@api/types';

import { AdminUserDetailPage } from './AdminUserDetailPage';

const ACCOUNTS = ['secretariat', 'member'] as const;
type Account = (typeof ACCOUNTS)[number];

const USERS = {
  member: {
    displayTitle: 'Mme la conseillère',
    email: 'helene.garnier@csm.justice.fr',
    firstName: 'Hélène',
    gender: 'FEMALE',
    id: 'user-2',
    isAdmin: false,
    lastName: 'Garnier',
    role: 'MEMBRE_SIEGE',
  },
  secretariat: {
    displayTitle: null,
    email: 'marc.dupont@csm.justice.fr',
    firstName: 'Marc',
    gender: 'MALE',
    id: 'user-3',
    isAdmin: true,
    lastName: 'Dupont',
    role: 'SECRETARY',
  },
} satisfies Record<Account, DetailedAdminUserDto>;

function AdminUserDetailPageStory(props: { account: Account }) {
  return (
    <PageStory
      location={generatePath(ROUTE_PATHS.ADMIN.USER_DETAIL, { userId: USERS[props.account].id })}
      path={ROUTE_PATHS.ADMIN.USER_DETAIL}
      view="sg"
    >
      <AdminUserDetailPage />
    </PageStory>
  );
}

const meta = {
  args: { account: 'secretariat' },
  argTypes: { account: { control: 'inline-radio', options: ACCOUNTS } },
  beforeEach: ({ msw }) => {
    msw.use(
      http.get('*/api/administration/v1/users/:userId', ({ params }) => {
        const user = Object.values(USERS).find(({ id }) => id === params.userId);
        return user ? HttpResponse.json<DetailedAdminUserDto>(user) : new HttpResponse(null, { status: 404 });
      }),
    );
  },
  component: AdminUserDetailPageStory,
  parameters: { layout: 'fullscreen' },
  title: 'Pages/Details/AdminUser',
} satisfies Meta<typeof AdminUserDetailPageStory>;

export default meta;

export const Playground: StoryObj<typeof meta> = {};
