import type { Meta, StoryObj } from '@storybook/react-vite';

import { SummaryContext } from '@/features/summary/context/SummaryContext';
import { ConfirmModalProvider } from '@/shared/context/confirm-modal';
import { StoryQueryClient } from '@/shared/storybook/StoryQueryClient';
import {
  makeSummary,
  seedSummaryStory,
  SUMMARY_ATTACHMENTS,
  SUMMARY_NOMINATION_FILE_ID,
  SUMMARY_SESSION_ID,
  SUMMARY_VIEWS,
  summaryObservationsHandlers,
  type SummaryView,
} from '@/shared/storybook/summary.fixtures';
import { ToastProvider } from '@/shared/ui/toast';

import { SummaryDetailsContent } from './SummaryDetailsContent';

const SUMMARY = makeSummary({
  auditionDate: { day: 15, month: 10, year: 2026 },
  auditionTime: { hours: 14, minutes: 30, seconds: 0 },
  observers: ['Syndicat de la magistrature'],
  priorities: ['ETOILE'],
  summary: {
    attachments: SUMMARY_ATTACHMENTS,
    readers: [{ firstName: 'Jean', id: 'member-1', lastName: 'Petit' }],
  },
});

function SummaryDetailsContentStory(props: { view: SummaryView }) {
  return (
    <StoryQueryClient key={props.view} seed={(client) => seedSummaryStory(client, props.view)}>
      <ToastProvider>
        <ConfirmModalProvider>
          <SummaryContext
            value={{
              canWriteSummary: props.view === 'sg',
              nominationFileId: SUMMARY_NOMINATION_FILE_ID,
              sessionId: SUMMARY_SESSION_ID,
              summary: SUMMARY,
            }}
          >
            <SummaryDetailsContent />
          </SummaryContext>
        </ConfirmModalProvider>
      </ToastProvider>
    </StoryQueryClient>
  );
}

const meta = {
  args: { view: 'sg' },
  argTypes: { view: { control: 'inline-radio', options: SUMMARY_VIEWS } },
  beforeEach: ({ msw }) => {
    msw.use(...summaryObservationsHandlers);
  },
  component: SummaryDetailsContentStory,
  parameters: { layout: 'fullscreen' },
  tags: ['autodocs'],
  title: 'Features/SummaryDetails/Page',
} satisfies Meta<typeof SummaryDetailsContentStory>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

export const Member: Story = {
  args: { view: 'member' },
};
