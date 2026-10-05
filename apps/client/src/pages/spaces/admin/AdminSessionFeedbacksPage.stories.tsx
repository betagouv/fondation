import type { Meta, StoryObj } from '@storybook/react-vite';

import { StoryQueryClient } from '@/shared/storybook/StoryQueryClient';
import { ToastProvider } from '@/shared/ui/toast';

import { AdminSessionFeedbacksPage } from './AdminSessionFeedbacksPage';

const meta = {
  component: AdminSessionFeedbacksPage,
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
  title: 'Pages/Admin/AdminSessionFeedbacksPage',
} satisfies Meta<typeof AdminSessionFeedbacksPage>;

export default meta;

export const Default: StoryObj<typeof meta> = {};
