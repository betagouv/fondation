import type { Meta, StoryObj } from '@storybook/react-vite';

import { sgAuthHandlers } from '@/shared/storybook/msw.handlers';
import { StoryQueryClient } from '@/shared/storybook/StoryQueryClient';

import { DocumentValidatedBanner } from './DocumentValidatedBanner';

const meta = {
  beforeEach: ({ msw }) => {
    msw.use(...sgAuthHandlers);
  },
  component: DocumentValidatedBanner,
  decorators: [
    (Story) => (
      <StoryQueryClient>
        <Story />
      </StoryQueryClient>
    ),
  ],
  parameters: { layout: 'fullscreen' },
  title: 'Pages/Documents/DocumentValidatedBanner',
} satisfies Meta<typeof DocumentValidatedBanner>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Agenda: Story = {
  args: {
    kind: 'agenda',
    validation: { at: '2026-09-22T08:12:00.000Z', by: { id: 'user-2', name: 'Lucas BERNARD' } },
  },
};

export const PresentedNotice: Story = {
  args: {
    kind: 'notice',
    presentation: {
      by: { id: 'user-sg', name: 'Claire MERCIER' },
      date: { day: 23, month: 9, year: 2026 },
      endTime: { hours: 12, minutes: 0, seconds: 0 },
    },
    validation: { at: '2026-09-22T08:12:00.000Z', by: { id: 'user-sg', name: 'Claire MERCIER' } },
  },
};

export const ValidatedBeforeTheTrace: Story = {
  args: {
    kind: 'notice',
    presentation: { by: null, date: { day: 23, month: 9, year: 2026 }, endTime: null },
    validation: null,
  },
};
