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
    presentation: { at: '2026-09-23T12:00:00.000Z', by: { id: 'user-sg', name: 'Claire MERCIER' } },
    validation: { at: '2026-09-22T08:12:00.000Z', by: { id: 'user-sg', name: 'Claire MERCIER' } },
  },
};

export const ValidatedBeforeTheTrace: Story = {
  args: { kind: 'notice', presentation: { at: '2026-09-23T12:00:00.000Z', by: null }, validation: null },
};
