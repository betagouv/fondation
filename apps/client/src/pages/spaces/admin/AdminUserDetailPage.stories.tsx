import type { Meta, StoryObj } from '@storybook/react-vite';
import { http, HttpResponse } from 'msw';
import { generatePath } from 'react-router';

import { PROMOTABLE_ROLES, ROLE_OPTIONS } from '@/features/administration/labels/admin-user-enum';
import { PageStory } from '@/shared/storybook/PageStory';
import { ROUTE_PATHS } from '@/utils/route-path.utils';
import type { DetailedAdminUserDto } from '@api/types';

import { AdminUserDetailPage } from './AdminUserDetailPage';

const ACCOUNTS = ['secretariat', 'member'] as const;
type Account = (typeof ACCOUNTS)[number];
const STATUSES = ['ACTIVE', 'DEACTIVATED'] as const satisfies readonly DetailedAdminUserDto['status'][];
type Status = (typeof STATUSES)[number];

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
} satisfies Record<
  Account,
  Omit<
    DetailedAdminUserDto,
    | 'assignableRoles'
    | 'canDeactivate'
    | 'canHoldAdminRight'
    | 'canImpersonate'
    | 'canReactivate'
    | 'deactivatedAt'
    | 'status'
    | 'statusChanges'
  >
>;

function AdminUserDetailPageStory(props: { account: Account; status: Status }) {
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
  args: { account: 'secretariat', status: 'ACTIVE' },
  argTypes: {
    account: { control: 'inline-radio', options: ACCOUNTS },
    status: { control: 'inline-radio', options: STATUSES },
  },
  beforeEach: ({ args, msw }) => {
    msw.use(
      http.get('*/api/administration/v1/users/:userId', ({ params }) => {
        const user = Object.values(USERS).find(({ id }) => id === params.userId);
        if (!user) return new HttpResponse(null, { status: 404 });

        return HttpResponse.json<DetailedAdminUserDto>({
          ...user,
          assignableRoles: user.isAdmin
            ? PROMOTABLE_ROLES
            : ROLE_OPTIONS.flatMap(({ options }) => options.map(({ id }) => id)),
          canDeactivate: args.status === 'ACTIVE',
          canHoldAdminRight: PROMOTABLE_ROLES.includes(user.role),
          canImpersonate: args.status === 'ACTIVE',
          canReactivate: args.status === 'DEACTIVATED',
          deactivatedAt: args.status === 'DEACTIVATED' ? '2026-10-21T12:32:00.000Z' : null,
          statusChanges:
            args.status === 'DEACTIVATED'
              ? [
                  { changedAt: '2026-10-21T12:32:00.000Z', status: 'DEACTIVATED' },
                  { changedAt: '2026-10-15T07:10:00.000Z', status: 'ACTIVE' },
                  { changedAt: '2026-10-14T16:05:00.000Z', status: 'DEACTIVATED' },
                  { changedAt: '2026-09-01T08:00:00.000Z', status: 'ACTIVE' },
                ]
              : [
                  { changedAt: '2026-10-15T07:10:00.000Z', status: 'ACTIVE' },
                  { changedAt: '2026-10-14T16:05:00.000Z', status: 'DEACTIVATED' },
                  { changedAt: '2026-09-01T08:00:00.000Z', status: 'ACTIVE' },
                ],
          status: args.status,
        });
      }),
    );
  },
  component: AdminUserDetailPageStory,
  parameters: { layout: 'fullscreen' },
  title: 'Pages/Details/AdminUser',
} satisfies Meta<typeof AdminUserDetailPageStory>;

export default meta;

export const Playground: StoryObj<typeof meta> = {};
