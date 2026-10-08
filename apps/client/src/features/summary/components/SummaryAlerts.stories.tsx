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

import { SummaryAlerts } from './SummaryAlerts';

const OUTCOMES = {
  SUSPENDED: { label: 'sursis à statuer', status: 'PENDING' },
  VALIDATED: { label: 'avis conforme', status: 'FINAL' },
} as const;

function SummaryAlertsStory(props: {
  auditionScheduled: boolean;
  missingEvaluation: boolean;
  outcome: keyof typeof OUTCOMES | null;
  view: SummaryView;
}) {
  const summary = makeSummary({
    auditionDate: props.auditionScheduled ? { day: 15, month: 10, year: 2026 } : null,
    auditionTime: props.auditionScheduled ? { hours: 14, minutes: 30, seconds: 0 } : null,
    missingEvaluation: props.missingEvaluation,
    outcome: props.outcome && { ...OUTCOMES[props.outcome], comment: null, value: props.outcome },
  });

  return (
    <StoryQueryClient key={props.view} seed={(client) => seedSummaryStory(client, props.view)}>
      <SummaryContext
        value={{
          canWriteSummary: false,
          nominationFileId: SUMMARY_NOMINATION_FILE_ID,
          sessionId: SUMMARY_SESSION_ID,
          summary,
        }}
      >
        <SummaryAlerts />
      </SummaryContext>
    </StoryQueryClient>
  );
}

const meta = {
  args: { auditionScheduled: false, missingEvaluation: false, outcome: 'VALIDATED', view: 'sg' },
  argTypes: {
    outcome: { control: 'inline-radio', options: [null, ...Object.keys(OUTCOMES)] },
    view: { control: 'inline-radio', options: SUMMARY_VIEWS },
  },
  component: SummaryAlertsStory,
  parameters: { layout: 'padded' },
  tags: ['autodocs'],
  title: 'Features/SummaryDetails/Alerts',
} satisfies Meta<typeof SummaryAlertsStory>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

export const AllAlerts: Story = {
  args: { auditionScheduled: true, missingEvaluation: true },
};

export const AuditionScheduled: Story = {
  args: { auditionScheduled: true, outcome: null },
};

export const MissingEvaluation: Story = {
  args: { missingEvaluation: true, outcome: null },
};

export const NoAlert: Story = {
  args: { outcome: null },
};

export const OutcomeForMember: Story = {
  args: { view: 'member' },
};

export const SuspendedOutcome: Story = {
  args: { outcome: 'SUSPENDED' },
};
