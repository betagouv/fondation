import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn } from 'storybook/test';

import { ACTION_ICONS } from '@/constants/icons.constants';
import { ConfirmationProvider } from '@/shared/context/confirmation';
import { DeleteFileButton } from '@/shared/ui/DeleteFileButton';
import { IconButton } from '@/shared/ui/icon-button';

import { SessionAttachmentsTable, type SessionAttachment } from './SessionAttachmentsTable';

const ATTACHMENTS: SessionAttachment[] = [
  {
    addedAt: { day: 4, month: 2, year: 2028 },
    id: 'file-1',
    name: 'Fiche de juridiction CA DOUAI.pdf',
    sizeInBytes: 248_000,
  },
  {
    addedAt: { day: 11, month: 2, year: 2028 },
    id: 'file-2',
    name: 'Note DSJ - évaluations manquantes.pdf',
    sizeInBytes: 1_240_000,
  },
  {
    addedAt: { day: 2, month: 3, year: 2028 },
    id: 'file-3',
    name: 'Tableau des effectifs 2028.xlsx',
    sizeInBytes: 86_000,
  },
];

const onDownload = fn().mockName('onDownload');
const onDelete = fn().mockName('onDelete');

function AttachmentActions(attachment: SessionAttachment) {
  return (
    <div className="-ml-2 flex items-center gap-1">
      <IconButton
        iconId={ACTION_ICONS.download}
        label={`Télécharger ${attachment.name}`}
        onClick={() => onDownload(attachment.name)}
      />
      <DeleteFileButton fileName={attachment.name} onDelete={() => onDelete(attachment.name)} />
    </div>
  );
}

const meta = {
  title: 'Session/Transparence/SessionAttachmentsTable',
  component: SessionAttachmentsTable,
  decorators: [
    (Story) => (
      <ConfirmationProvider>
        <Story />
      </ConfirmationProvider>
    ),
  ],
  parameters: { controls: { include: ['attachments'] }, layout: 'padded' },
  tags: ['autodocs'],
  args: { actions: AttachmentActions, attachments: ATTACHMENTS },
} satisfies Meta<typeof SessionAttachmentsTable>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

export const Empty: Story = {
  args: { attachments: [] },
};

export const ManyRows: Story = {
  args: {
    attachments: Array.from({ length: 100 }, (_, index) => ({
      addedAt: { day: (index % 28) + 1, month: (index % 12) + 1, year: 2028 },
      id: `file-${index}`,
      name: `Fiche de juridiction ${index + 1}.pdf`,
      sizeInBytes: 120_000 + index * 4_096,
    })),
  },
};
