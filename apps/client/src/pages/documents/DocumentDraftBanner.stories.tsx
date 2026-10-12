import type { Meta, StoryObj } from '@storybook/react-vite';

import { sgAuthHandlers } from '@/shared/storybook/msw.handlers';
import { StoryQueryClient } from '@/shared/storybook/StoryQueryClient';

import { DocumentDraftBanner } from './DocumentDraftBanner';

const CLAIRE = { id: 'user-sg', name: 'Claire MERCIER' };
const LUCAS = { id: 'user-2', name: 'Lucas BERNARD' };

const meta = {
  beforeEach: ({ msw }) => {
    msw.use(...sgAuthHandlers);
  },
  component: DocumentDraftBanner,
  decorators: [
    (Story) => (
      <StoryQueryClient>
        <Story />
      </StoryQueryClient>
    ),
  ],
  parameters: { layout: 'fullscreen' },
  title: 'Pages/Documents/DocumentDraftBanner',
} satisfies Meta<typeof DocumentDraftBanner>;

export default meta;

type Story = StoryObj<typeof meta>;

export const NeverValidated: Story = {
  args: {
    draft: {
      openedAt: '2026-09-24T13:25:00.000Z',
      openedBy: CLAIRE,
      systemCauses: [],
      systemUpdatedAt: null,
      updatedAt: null,
      updatedBy: null,
    },
    hasValidatedVersion: false,
    kind: 'agenda',
  },
};

export const ChangesInProgress: Story = {
  args: {
    draft: {
      openedAt: '2026-09-24T13:25:00.000Z',
      openedBy: CLAIRE,
      systemCauses: [],
      systemUpdatedAt: null,
      updatedAt: '2026-09-24T14:02:00.000Z',
      updatedBy: LUCAS,
    },
    hasValidatedVersion: true,
    kind: 'officialReport',
    validatedAt: '2026-09-22T08:12:00.000Z',
  },
};

export const UpdatedByTheApplication: Story = {
  args: {
    draft: {
      openedAt: '2026-09-24T13:10:00.000Z',
      openedBy: null,
      systemCauses: ['AGENDA_TEXT', 'REPORTERS'],
      systemUpdatedAt: '2026-09-24T14:02:00.000Z',
      updatedAt: null,
      updatedBy: null,
    },
    hasValidatedVersion: true,
    kind: 'officialReport',
    validatedAt: '2026-09-22T08:12:00.000Z',
  },
};

export const NoticeDraft: Story = {
  args: {
    draft: {
      openedAt: '2026-09-24T07:21:00.000Z',
      openedBy: CLAIRE,
      systemCauses: [],
      systemUpdatedAt: null,
      updatedAt: '2026-09-24T09:12:00.000Z',
      updatedBy: CLAIRE,
    },
    hasValidatedVersion: false,
    kind: 'notice',
  },
};
