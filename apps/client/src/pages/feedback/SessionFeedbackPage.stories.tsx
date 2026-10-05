import type { Meta, StoryObj } from '@storybook/react-vite';
import { http, HttpResponse } from 'msw';

import { ConfirmModalProvider } from '@/shared/context/confirm-modal';
import { StoryQueryClient } from '@/shared/storybook/StoryQueryClient';
import { ToastProvider } from '@/shared/ui/toast';
import type { FoundSessionFeedbackDto } from '@api/types';

import { SessionFeedbackPage } from './SessionFeedbackPage';

function feedbackHandler(
  questionnaire: 'MEMBER' | 'SECRETARIAT',
  status: 'NOT_ANSWERED' | 'PREVIEW' = 'NOT_ANSWERED',
) {
  return http.get('*/api/session-feedbacks/v1/:sessionId', () =>
    HttpResponse.json<FoundSessionFeedbackDto>({
      feedback: {
        questionnaire,
        session: {
          date: { day: 1, month: 10, year: 2026 },
          id: 'session-1',
          name: 'Transparence du 1er octobre',
        },
        status,
      },
    }),
  );
}

const meta = {
  component: SessionFeedbackPage,
  decorators: [
    (Story) => (
      <StoryQueryClient>
        <ToastProvider>
          <ConfirmModalProvider>
            <Story />
          </ConfirmModalProvider>
        </ToastProvider>
      </StoryQueryClient>
    ),
  ],
  parameters: {
    layout: 'fullscreen',
    router: {
      initialEntries: ['/secretariat-general/session/session-1/avis'],
      path: '/secretariat-general/session/:sessionId/avis',
    },
  },
  title: 'Pages/Feedback/SessionFeedbackPage',
} satisfies Meta<typeof SessionFeedbackPage>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Member: Story = {
  beforeEach: ({ msw }) => {
    msw.use(feedbackHandler('MEMBER'));
  },
};

export const Secretariat: Story = {
  beforeEach: ({ msw }) => {
    msw.use(feedbackHandler('SECRETARIAT'));
  },
};

export const AdminPreview: Story = {
  beforeEach: ({ msw }) => {
    msw.use(feedbackHandler('SECRETARIAT', 'PREVIEW'));
  },
};
