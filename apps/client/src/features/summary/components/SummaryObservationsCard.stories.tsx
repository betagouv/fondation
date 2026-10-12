import type { Meta, StoryObj } from '@storybook/react-vite';

import { SummaryContext } from '@/features/summary/context/SummaryContext';
import { ConfirmModalProvider } from '@/shared/context/confirm-modal';
import { StoryQueryClient } from '@/shared/storybook/StoryQueryClient';
import {
  makeSummary,
  seedSummaryStory,
  SUMMARY_NOMINATION_FILE_ID,
  SUMMARY_NOMINATION_FILE_WITHOUT_OBSERVATIONS_ID,
  SUMMARY_SESSION_ID,
  SUMMARY_VIEWS,
  summaryObservationsHandlers,
  type SummaryView,
} from '@/shared/storybook/summary.fixtures';

import { SummaryObservationsCard } from './SummaryObservationsCard';

const OBSERVERS = ['Syndicat de la magistrature', 'Union syndicale des magistrats'];

function SummaryObservationsCardStory(props: {
  observations: boolean;
  observers: boolean;
  view: SummaryView;
}) {
  return (
    <StoryQueryClient
      key={`${props.view}-${props.observations}`}
      seed={(client) => seedSummaryStory(client, props.view)}
    >
      <ConfirmModalProvider>
        <SummaryContext
          value={{
            canWriteSummary: false,
            nominationFileId: props.observations
              ? SUMMARY_NOMINATION_FILE_ID
              : SUMMARY_NOMINATION_FILE_WITHOUT_OBSERVATIONS_ID,
            sessionId: SUMMARY_SESSION_ID,
            summary: makeSummary({ observers: props.observers ? OBSERVERS : [] }),
          }}
        >
          <SummaryObservationsCard />
        </SummaryContext>
      </ConfirmModalProvider>
    </StoryQueryClient>
  );
}

const meta = {
  args: { observations: true, observers: true, view: 'sg' },
  argTypes: { view: { control: 'inline-radio', options: SUMMARY_VIEWS } },
  beforeEach: ({ msw }) => {
    msw.use(...summaryObservationsHandlers);
  },
  component: SummaryObservationsCardStory,
  parameters: { layout: 'padded' },
  tags: ['autodocs'],
  title: 'Features/SummaryDetails/ObservationsCard',
} satisfies Meta<typeof SummaryObservationsCardStory>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

export const Member: Story = {
  args: { view: 'member' },
};

export const ObservationsOnly: Story = {
  args: { observers: false },
};

export const ObserversOnly: Story = {
  args: { observations: false },
};
