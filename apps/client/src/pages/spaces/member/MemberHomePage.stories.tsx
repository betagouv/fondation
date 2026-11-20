import type { Meta, StoryObj } from '@storybook/react-vite';
import { delay, http, HttpResponse } from 'msw';

import { PageStory } from '@/shared/storybook/PageStory';
import { clock } from '@/utils/clock';
import { ROUTE_PATHS } from '@/utils/route-path.utils';
import type { ListedMemberSessionsDto } from '@api/types';

import { MemberHomePage } from './MemberHomePage';

const SESSIONS: ListedMemberSessionsDto['items'] = [
  {
    date: { day: 20, month: 2, year: 2028 },
    fileCount: 20,
    formation: 'PARQUET',
    id: 'abc',
    isAffected: true,
    name: 'Transparence ABC',
    propositionCount: 120,
    reportCounts: { IN_PROGRESS: 0, NEW: 20, READY_TO_SUPPORT: 0, SUPPORTED: 0 },
  },
  {
    date: { day: 20, month: 2, year: 2028 },
    fileCount: 0,
    formation: 'SIEGE',
    id: 'xyz',
    isAffected: false,
    name: 'Transparence XYZ',
    propositionCount: 120,
    reportCounts: { IN_PROGRESS: 0, NEW: 0, READY_TO_SUPPORT: 0, SUPPORTED: 0 },
  },
  {
    date: { day: 12, month: 2, year: 2028 },
    fileCount: 2,
    formation: 'SIEGE',
    id: 'auditeurs',
    isAffected: true,
    name: 'Auditeurs de justice',
    propositionCount: 62,
    reportCounts: { IN_PROGRESS: 1, NEW: 0, READY_TO_SUPPORT: 0, SUPPORTED: 1 },
  },
];

const RESPONSES = {
  error: 'error',
  loading: 'loading',
  'no session': [],
  'reporter on none': SESSIONS.filter(({ isAffected }) => !isAffected),
  sessions: SESSIONS,
} satisfies Record<string, ListedMemberSessionsDto['items'] | 'error' | 'loading'>;
type Response = keyof typeof RESPONSES;

const MOMENTS = { day: 10, evening: 20 };
type Moment = keyof typeof MOMENTS;

// beforeEach only runs once: the controls reach the handler through this value
let response: Response = 'sessions';

function MemberHomePageStory(props: { moment: Moment; response: Response }) {
  response = props.response;
  clock.now = () => new Date(2026, 10, 20, MOMENTS[props.moment]);

  return (
    <PageStory
      key={`${props.moment}-${props.response}`}
      location={ROUTE_PATHS.TRANSPARENCES.DASHBOARD}
      path={ROUTE_PATHS.TRANSPARENCES.DASHBOARD}
      view="member"
    >
      <MemberHomePage />
    </PageStory>
  );
}

const meta = {
  args: { moment: 'day', response: 'sessions' },
  argTypes: {
    moment: { control: 'inline-radio', name: 'time of day', options: Object.keys(MOMENTS) },
    response: { control: 'inline-radio', name: 'API response', options: Object.keys(RESPONSES) },
  },
  beforeEach: ({ msw }) => {
    msw.use(
      http.get('*/api/members/v1/:userId/sessions/transparence/garde-des-sceaux', async () => {
        const items = RESPONSES[response];
        if (items === 'loading') {
          await delay('infinite');
          return new HttpResponse(null);
        }
        if (items === 'error') return new HttpResponse(null, { status: 500 });
        return HttpResponse.json<ListedMemberSessionsDto>({ items });
      }),
    );
  },
  component: MemberHomePageStory,
  parameters: {
    docs: {
      description: {
        component:
          "Accueil du membre. Il est salué d'un « Bonjour » de 6 h à 18 h, d'un « Bonsoir » sinon, et choisit le pouvoir de proposition (le CSM est en construction). Il voit les sessions en cours de sa formation. Sur une session où il est rapporteur, la carte compte ses dossiers par état de rapport, et « Vos dossiers » ouvre la session sur ses seuls dossiers. L'interrupteur ne garde que ces sessions et disparaît quand aucune session n'est en cours.",
      },
    },
    layout: 'fullscreen',
  },
  title: 'Pages/HomePage/Member',
} satisfies Meta<typeof MemberHomePageStory>;

export default meta;

export const Playground: StoryObj<typeof meta> = {};
