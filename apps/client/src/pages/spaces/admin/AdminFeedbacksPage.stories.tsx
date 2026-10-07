import type { Meta, StoryObj } from '@storybook/react-vite';

import { StoryQueryClient } from '@/shared/storybook/StoryQueryClient';
import { ToastProvider } from '@/shared/ui/toast';

import { AdminFeedbacksPage } from './AdminFeedbacksPage';

const meta = {
  component: AdminFeedbacksPage,
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
  tags: ['autodocs'],
  title: 'Features/Feedback/AdminPage',
} satisfies Meta<typeof AdminFeedbacksPage>;

export default meta;

export const Default: StoryObj<typeof meta> = {};
