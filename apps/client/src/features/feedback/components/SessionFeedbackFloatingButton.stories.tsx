import type { Meta, StoryObj } from '@storybook/react-vite';
import { http, HttpResponse } from 'msw';

import { SessionCommentPanel } from '@/features/transparence/components/session/SessionCommentPanel';
import { StoryQueryClient } from '@/shared/storybook/StoryQueryClient';
import { ToastProvider } from '@/shared/ui/toast';
import type { DetailedSessionCommentDto, FoundSessionFeedbackDto } from '@api/types';

import { SessionFeedbackFloatingButton, SessionFeedbackButton } from './SessionFeedbackFloatingButton';

const meta = {
  args: { sessionId: 'session-1' },
  beforeEach: ({ msw }) => {
    msw.use(
      http.get('*/api/sessions/v2/:sessionId/comment', () =>
        HttpResponse.json<DetailedSessionCommentDto>({ comment: null, writtenAt: null, writtenBy: null }),
      ),
      http.get('*/api/session-feedbacks/v1/:sessionId', () =>
        HttpResponse.json<FoundSessionFeedbackDto>({
          feedback: {
            questionnaire: 'SECRETARIAT',
            session: {
              date: { day: 1, month: 10, year: 2026 },
              id: 'session-1',
              name: 'Transparence du 1er octobre',
            },
            status: 'NOT_ANSWERED',
          },
        }),
      ),
    );
  },
  component: SessionFeedbackFloatingButton,
  decorators: [
    (Story) => (
      <StoryQueryClient>
        <ToastProvider>
          <Story />
        </ToastProvider>
      </StoryQueryClient>
    ),
  ],
  parameters: { layout: 'fullscreen' },
  title: 'Features/Feedback/SessionFeedbackFloatingButton',
} satisfies Meta<typeof SessionFeedbackFloatingButton>;

export default meta;

export const NotAnswered: StoryObj<typeof meta> = {};

export const NextToTheComment: StoryObj<typeof meta> = {
  render: (args) => (
    <SessionCommentPanel
      isArchived={false}
      sessionId={args.sessionId}
      toolbarEnd={<SessionFeedbackButton {...args} />}
    />
  ),
};
