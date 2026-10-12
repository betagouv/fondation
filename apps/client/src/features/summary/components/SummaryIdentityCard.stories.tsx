import type { Meta, StoryObj } from '@storybook/react-vite';

import { SummaryContext } from '@/features/summary/context/SummaryContext';
import {
  makeSummary,
  SUMMARY_NOMINATION_FILE_ID,
  SUMMARY_SESSION_ID,
} from '@/shared/storybook/summary.fixtures';
import type { DetailedSummaryDto } from '@api/types';

import { SummaryIdentityCard } from './SummaryIdentityCard';

function SummaryIdentityCardStory(props: { summary: DetailedSummaryDto }) {
  return (
    <SummaryContext
      value={{
        canWriteSummary: false,
        nominationFileId: SUMMARY_NOMINATION_FILE_ID,
        sessionId: SUMMARY_SESSION_ID,
        summary: props.summary,
      }}
    >
      <SummaryIdentityCard />
    </SummaryContext>
  );
}

const meta = {
  args: { summary: makeSummary() },
  argTypes: { summary: { table: { disable: true } } },
  component: SummaryIdentityCardStory,
  parameters: { layout: 'padded' },
  tags: ['autodocs'],
  title: 'Features/SummaryDetails/IdentityCard',
} satisfies Meta<typeof SummaryIdentityCardStory>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

export const SparseData: Story = {
  args: {
    summary: makeSummary({
      birthDate: null,
      grade: null,
      lastPositionDate: null,
      position: null,
      rank: null,
      targetedGrade: null,
    }),
  },
};

export const WithoutBiography: Story = {
  args: { summary: makeSummary({ biography: '' }) },
};
