import type { Meta, StoryObj } from '@storybook/react-vite';
import { http, HttpResponse } from 'msw';

import { sgAuthHandlers } from '@/shared/storybook/msw.handlers';
import { StoryQueryClient } from '@/shared/storybook/StoryQueryClient';
import { ToastProvider } from '@/shared/ui/toast';
import type { ListedFollowedUpObservationsDto } from '@api/types';

import { FollowedUpObservationsTable } from './FollowedUpObservationsTable';

type Observations = ListedFollowedUpObservationsDto['items'];

const DURAND = {
  currentPosition: 'Vice-présidente du tribunal judiciaire de LILLE',
  id: 'magistrat-1',
  name: 'DURAND Claire',
};

const KOFFI_FILE = {
  id: 'file-3',
  magistrat: { currentPosition: 'Juge TJ DOUAI', grade: 'II', id: 'magistrat-3', name: 'KOFFI Aminata' },
  number: 3,
  targeted: { grade: 'I', position: 'Vice-présidente TJ LILLE' },
};

const JUNE = {
  date: { day: 1, month: 6, year: 2028 },
  id: 'session-june',
  name: 'Transparence du 1er juin 2028',
  status: 'ONGOING',
} as const;

const UNTRACKED = { comment: null, status: 'IN_PROGRESS' } as const;
const JUNE_TRACKING = { comment: 'Signalement transmis au premier président', status: 'DONE' } as const;

// Durand wrote in both sessions: two blocs, one per session, each with its own tracking. Proposed in June,
// after her March observations, she shows that proposition in her March bloc
const OBSERVATIONS: Observations = [
  {
    laterPropositions: [],
    observation: {
      dateReception: { day: 4, month: 6, year: 2028 },
      followUp: 'ALERT',
      id: 'observation-1',
      nominationFile: KOFFI_FILE,
      observant: DURAND,
    },
    session: JUNE,
    tracking: JUNE_TRACKING,
  },
  {
    laterPropositions: [],
    observation: {
      dateReception: { day: 2, month: 6, year: 2028 },
      followUp: 'INTERESTING',
      id: 'observation-2',
      nominationFile: {
        id: 'file-7',
        // not detected in LOLFI: no link to a magistrat page
        magistrat: {
          currentPosition: 'Substitut du procureur TJ ARRAS',
          grade: 'II',
          id: null,
          name: 'MARTIN Paul',
        },
        number: 7,
        targeted: { grade: 'I', position: 'Procureur adjoint TJ LILLE' },
      },
      observant: DURAND,
    },
    session: JUNE,
    tracking: JUNE_TRACKING,
  },
  {
    laterPropositions: [
      {
        id: 'file-30',
        number: 30,
        session: { date: JUNE.date, id: JUNE.id, name: JUNE.name },
        targeted: { grade: 'I', position: 'Présidente de chambre CA DOUAI' },
      },
    ],
    observation: {
      dateReception: { day: 10, month: 3, year: 2028 },
      followUp: 'REFERENCE',
      id: 'observation-3',
      nominationFile: { ...KOFFI_FILE, id: 'file-12', number: 12 },
      observant: DURAND,
    },
    session: {
      date: { day: 2, month: 3, year: 2028 },
      id: 'session-march',
      name: 'Transparence du 2 mars 2028',
      status: 'REPORTED',
    },
    tracking: UNTRACKED,
  },
  {
    laterPropositions: [],
    observation: {
      dateReception: { day: 3, month: 11, year: 2027 },
      followUp: 'ALERT',
      id: 'observation-4',
      nominationFile: { ...KOFFI_FILE, id: 'file-21', number: 21 },
      observant: {
        currentPosition: null,
        id: 'magistrat-2',
        name: 'DE LA ROCHEFOUCAULD-MONTMORENCY Marie-Hélène Bérénice',
      },
    },
    session: {
      date: { day: 15, month: 10, year: 2027 },
      id: 'session-october',
      name: 'Transparence du 15 octobre 2027',
      status: 'ARCHIVED',
    },
    tracking: { comment: null, status: 'DONE' },
  },
];

const datasets: Record<string, Observations> = { blocs: OBSERVATIONS, empty: [] };

function FollowedUpObservationsTableStory(props: { dataset: string }) {
  return (
    <StoryQueryClient key={props.dataset}>
      <ToastProvider>
        <FollowedUpObservationsTable />
      </ToastProvider>
    </StoryQueryClient>
  );
}

const meta = {
  args: { dataset: 'blocs' },
  argTypes: { dataset: { control: 'inline-radio', options: Object.keys(datasets) } },
  beforeEach: ({ args, msw }) => {
    const items = datasets[args.dataset] ?? [];
    msw.use(
      ...sgAuthHandlers,
      http.get('*/api/observations/v1', () =>
        HttpResponse.json<ListedFollowedUpObservationsDto>({
          currentPageIndex: 1,
          items,
          totalCount: items.length,
        }),
      ),
      http.put(
        '*/api/sessions/v2/:sessionId/observation-blocks/:magistratId/tracking',
        () => new HttpResponse(null, { status: 204 }),
      ),
    );
  },
  component: FollowedUpObservationsTableStory,
  parameters: { layout: 'padded' },
  title: 'Features/Observations/FollowedUpObservationsTable',
} satisfies Meta<typeof FollowedUpObservationsTableStory>;

export default meta;

export const Playground: StoryObj<typeof meta> = {};
