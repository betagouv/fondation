import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn } from 'storybook/test';

import { ConfirmModalProvider } from '@/shared/context/confirm-modal';
import { StoryQueryClient } from '@/shared/storybook/StoryQueryClient';
import { ToastProvider } from '@/shared/ui/toast';
import { authKeys } from '@queries/auth.queries';

import { AttachedFilesList } from './AttachedFilesList';
import { ReportAttachmentsCard } from './ReportAttachmentsCard';

const CURRENT_USER = {
  civility: 'Monsieur PETIT',
  firstName: 'Jean',
  id: 'member-1',
  isImpersonated: false,
  lastName: 'Petit',
  role: 'MEMBRE_DU_SIEGE',
};

const ATTACHMENTS = [
  {
    addedAt: '2026-06-01T08:30:00.000Z',
    addedBy: { id: CURRENT_USER.id, name: 'Jean PETIT' },
    fileId: 'file-1',
    name: 'notes-entretien.pdf',
    size: 63_365,
  },
  {
    addedAt: '2026-06-02T14:10:00.000Z',
    addedBy: null,
    fileId: 'file-2',
    name: 'organigramme-juridiction.png',
    size: null,
  },
];

const onDeleteAttachment = fn().mockName('onDelete');

const meta = {
  title: 'Features/ReportDetails/AttachmentsCard',
  component: ReportAttachmentsCard,
  parameters: { controls: { include: ['isPending', 'isReadOnly'] }, layout: 'padded' },
  tags: ['autodocs'],
  args: { isPending: false, isReadOnly: false, onFilesAttached: fn().mockName('onFilesAttached') },
} satisfies Meta<typeof ReportAttachmentsCard>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

export const ArchivedSession: Story = {
  args: { isReadOnly: true },
};

export const Uploading: Story = {
  args: { isPending: true },
};

export const WithAttachments: Story = {
  decorators: [
    (Story) => (
      <StoryQueryClient seed={(client) => client.setQueryData(authKeys.introspectSession(), CURRENT_USER)}>
        <ToastProvider>
          <ConfirmModalProvider>
            <Story />
          </ConfirmModalProvider>
        </ToastProvider>
      </StoryQueryClient>
    ),
  ],
  render: (args) => (
    <ReportAttachmentsCard {...args}>
      <AttachedFilesList
        attachments={ATTACHMENTS}
        isReadOnly={args.isReadOnly}
        onDelete={onDeleteAttachment}
        reportId="report-1"
      />
    </ReportAttachmentsCard>
  ),
};
