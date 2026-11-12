import type { Meta, StoryObj } from '@storybook/react-vite';
import { http, HttpResponse } from 'msw';

import { sgAuthHandlers } from '@/shared/storybook/msw.handlers';
import { StoryQueryClient } from '@/shared/storybook/StoryQueryClient';
import type { ListedSessionObservationsDto } from '@api/types';

import { SessionObservationsTable } from './SessionObservationsTable';

type Observations = ListedSessionObservationsDto['items'];

const DURAND = {
  currentPosition: 'Vice-présidente du tribunal judiciaire de LILLE',
  id: 'magistrat-1',
  name: 'DURAND Claire',
};

const OBSERVATIONS: Observations = [
  {
    dateReception: { day: 4, month: 11, year: 2028 },
    followUp: 'ALERT',
    id: 'observation-1',
    nominationFile: {
      id: 'file-3',
      magistrat: { currentPosition: 'Juge TJ DOUAI', grade: 'II', name: 'KOFFI Aminata' },
      number: 3,
      targeted: { grade: 'I', position: 'Vice-présidente TJ LILLE' },
    },
    observant: DURAND,
  },
  {
    dateReception: { day: 2, month: 11, year: 2028 },
    followUp: null,
    id: 'observation-2',
    nominationFile: {
      id: 'file-7',
      magistrat: { currentPosition: 'Substitut du procureur TJ ARRAS', grade: 'II', name: 'MARTIN Paul' },
      number: 7,
      targeted: { grade: 'I', position: 'Procureur adjoint TJ LILLE' },
    },
    observant: DURAND,
  },
  {
    dateReception: { day: 3, month: 11, year: 2028 },
    followUp: 'REFERENCE',
    id: 'observation-3',
    nominationFile: {
      id: 'file-3',
      magistrat: { currentPosition: 'Juge TJ DOUAI', grade: 'II', name: 'KOFFI Aminata' },
      number: 3,
      targeted: { grade: 'I', position: 'Vice-présidente TJ LILLE' },
    },
    observant: {
      currentPosition: null,
      id: 'magistrat-2',
      name: 'DE LA ROCHEFOUCAULD-MONTMORENCY Marie-Hélène Bérénice',
    },
  },
];

const sessions: Record<string, Observations> = { blocs: OBSERVATIONS, empty: [] };

const observationsHandlers = [
  http.get('*/api/sessions/v2/:sessionId/observations', ({ params }) => {
    const items = sessions[String(params.sessionId)] ?? [];
    return HttpResponse.json<ListedSessionObservationsDto>({
      currentPageIndex: 1,
      items,
      totalCount: items.length,
    });
  }),
];

function SessionObservationsTableStory(props: { sessionId: string }) {
  return (
    <StoryQueryClient key={props.sessionId}>
      <SessionObservationsTable filtersSlot={null} sessionId={props.sessionId} toolbarSlot={null} />
    </StoryQueryClient>
  );
}

const meta = {
  args: { sessionId: 'blocs' },
  argTypes: { sessionId: { control: 'inline-radio', options: Object.keys(sessions) } },
  beforeEach: ({ msw }) => {
    msw.use(...sgAuthHandlers, ...observationsHandlers);
  },
  component: SessionObservationsTableStory,
  parameters: { layout: 'padded' },
  title: 'Session/GDS/SessionObservationsTable',
} satisfies Meta<typeof SessionObservationsTableStory>;

export default meta;

export const Playground: StoryObj<typeof meta> = {};
