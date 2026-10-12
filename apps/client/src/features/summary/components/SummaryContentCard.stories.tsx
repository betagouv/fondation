import type { Meta, StoryObj } from '@storybook/react-vite';

import { SummaryContext } from '@/features/summary/context/SummaryContext';
import { StoryQueryClient } from '@/shared/storybook/StoryQueryClient';
import {
  makeSummary,
  SUMMARY_NOMINATION_FILE_ID,
  SUMMARY_SESSION_ID,
} from '@/shared/storybook/summary.fixtures';

import { SummaryContentCard } from './SummaryContentCard';

function SummaryContentCardStory(props: { canWriteSummary: boolean; isArchived: boolean }) {
  return (
    <StoryQueryClient>
      <SummaryContext
        value={{
          canWriteSummary: props.canWriteSummary,
          nominationFileId: SUMMARY_NOMINATION_FILE_ID,
          sessionId: SUMMARY_SESSION_ID,
          summary: makeSummary({ isArchived: props.isArchived }),
        }}
      >
        <SummaryContentCard />
      </SummaryContext>
    </StoryQueryClient>
  );
}

const meta = {
  args: { canWriteSummary: true, isArchived: false },
  component: SummaryContentCardStory,
  parameters: { layout: 'padded' },
  tags: ['autodocs'],
  title: 'Features/SummaryDetails/ContentCard',
} satisfies Meta<typeof SummaryContentCardStory>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

export const ArchivedSession: Story = {
  args: { isArchived: true },
};

export const ReadOnly: Story = {
  args: { canWriteSummary: false },
};
