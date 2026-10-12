import type { Meta, StoryObj } from '@storybook/react-vite';

import { SummaryContext } from '@/features/summary/context/SummaryContext';
import { StoryQueryClient } from '@/shared/storybook/StoryQueryClient';
import {
  makeSummary,
  seedSummaryStory,
  SUMMARY_NOMINATION_FILE_ID,
  SUMMARY_SESSION_ID,
  SUMMARY_VIEWS,
  type SummaryView,
} from '@/shared/storybook/summary.fixtures';
import type { DetailedSummaryDto } from '@api/types';

import { SummaryDetailsHeader } from './SummaryDetailsHeader';

const READERS = [
  { firstName: 'Léa', id: 'reader-1', lastName: 'Martin' },
  { firstName: 'Paul', id: 'reader-2', lastName: 'Durand' },
];

function SummaryDetailsHeaderStory(props: {
  canWriteSummary: boolean;
  isArchived: boolean;
  priorities: DetailedSummaryDto['priorities'];
  readers: boolean;
  view: SummaryView;
}) {
  const summary = makeSummary({
    isArchived: props.isArchived,
    priorities: props.priorities,
    summary: { readers: props.readers ? READERS : [] },
  });

  return (
    <StoryQueryClient key={props.view} seed={(client) => seedSummaryStory(client, props.view)}>
      <SummaryContext
        value={{
          canWriteSummary: props.canWriteSummary,
          nominationFileId: SUMMARY_NOMINATION_FILE_ID,
          sessionId: SUMMARY_SESSION_ID,
          summary,
        }}
      >
        <SummaryDetailsHeader />
      </SummaryContext>
    </StoryQueryClient>
  );
}

const meta = {
  args: { canWriteSummary: true, isArchived: false, priorities: [], readers: false, view: 'sg' },
  argTypes: {
    priorities: { control: 'check', options: ['ETOILE', 'OUTRE_MER', 'PROFILE'] },
    view: { control: 'inline-radio', options: SUMMARY_VIEWS },
  },
  component: SummaryDetailsHeaderStory,
  parameters: { layout: 'padded' },
  tags: ['autodocs'],
  title: 'Features/SummaryDetails/Header',
} satisfies Meta<typeof SummaryDetailsHeaderStory>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

export const ArchivedSession: Story = {
  args: { isArchived: true, readers: true },
};

export const Member: Story = {
  args: { canWriteSummary: false, view: 'member' },
};

export const WithPriorities: Story = {
  args: { priorities: ['ETOILE', 'OUTRE_MER'] },
};

export const WithReaders: Story = {
  args: { readers: true },
};
