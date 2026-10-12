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
} from '@/shared/storybook/summary.fixtures';
import { ToastProvider } from '@/shared/ui/toast';

import { SummaryAttachmentsCard } from './SummaryAttachmentsCard';

function SummaryAttachmentsCardStory(props: {
  canWriteSummary: boolean;
  hasAttachments: boolean;
  isArchived: boolean;
}) {
  const summary = makeSummary({
    isArchived: props.isArchived,
    summary: { attachments: props.hasAttachments ? SUMMARY_ATTACHMENTS : [] },
  });

  return (
    <StoryQueryClient seed={(client) => seedSummaryStory(client, 'sg')}>
      <ToastProvider>
        <ConfirmModalProvider>
          <SummaryContext
            value={{
              canWriteSummary: props.canWriteSummary,
              nominationFileId: SUMMARY_NOMINATION_FILE_ID,
              sessionId: SUMMARY_SESSION_ID,
              summary,
            }}
          >
            <SummaryAttachmentsCard />
          </SummaryContext>
        </ConfirmModalProvider>
      </ToastProvider>
    </StoryQueryClient>
  );
}

const meta = {
  args: { canWriteSummary: true, hasAttachments: true, isArchived: false },
  component: SummaryAttachmentsCardStory,
  parameters: { layout: 'padded' },
  tags: ['autodocs'],
  title: 'Features/SummaryDetails/AttachmentsCard',
} satisfies Meta<typeof SummaryAttachmentsCardStory>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

export const ArchivedSession: Story = {
  args: { isArchived: true },
};

export const EmptyReadOnly: Story = {
  args: { canWriteSummary: false, hasAttachments: false },
};

export const EmptyWritable: Story = {
  args: { hasAttachments: false },
};

export const ReadOnly: Story = {
  args: { canWriteSummary: false },
};
