import Button from '@codegouvfr/react-dsfr/Button';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { http, HttpResponse } from 'msw';
import { fn } from 'storybook/test';

import { ConfirmModalProvider } from '@/shared/context/confirm-modal';
import { StoryQueryClient } from '@/shared/storybook/StoryQueryClient';
import { DeleteFileButton } from '@/shared/ui/DeleteFileButton';
import { ToastProvider } from '@/shared/ui/toast';
import type {
  DetailedNominationSessionAttachmentDto,
  ListedNominationSessionAttachmentDto,
} from '@api/types';

import { SessionAttachmentsTab } from './SessionAttachmentsTab';

type Attachments = ListedNominationSessionAttachmentDto['items'];

const ATTACHMENTS: Attachments = [
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

const MANY_ATTACHMENTS: Attachments = Array.from({ length: 100 }, (_, index) => ({
  addedAt: { day: (index % 28) + 1, month: (index % 12) + 1, year: 2028 },
  id: `file-${index}`,
  name: `Fiche de juridiction ${index + 1}.pdf`,
  sizeInBytes: 120_000 + index * 4_096,
}));

const sessions: Record<string, Attachments> = {
  draft: ATTACHMENTS,
  empty: [],
  'many-attachments': MANY_ATTACHMENTS,
};

const attachmentsHandlers = [
  http.get('*/api/sessions/v2/:sessionId/attachments', ({ params }) =>
    HttpResponse.json<ListedNominationSessionAttachmentDto>({
      items: sessions[String(params.sessionId)] ?? [],
    }),
  ),
  http.get('*/api/sessions/v2/:sessionId/attachments/:fileId', ({ params }) =>
    HttpResponse.json<DetailedNominationSessionAttachmentDto>({
      id: String(params.fileId),
      name: 'document.pdf',
      url: 'about:blank',
    }),
  ),
  http.delete(
    '*/api/sessions/v2/:sessionId/attachments/:fileId',
    () => new HttpResponse(null, { status: 204 }),
  ),
];

const onDelete = fn().mockName('onDelete');
const onImport = fn().mockName('onImport');

const managerProps = {
  extraActions: (attachment: Attachments[number]) => (
    <DeleteFileButton fileName={attachment.name} onDelete={() => onDelete(attachment.name)} />
  ),
  headerEnd: (
    <Button className="py-2!" iconId="fr-icon-add-line" onClick={onImport} priority="primary" size="small">
      Ajouter une pièce jointe
    </Button>
  ),
};

const meta = {
  title: 'Session/Transparence/SessionAttachmentsTable',
  component: SessionAttachmentsTab,
  beforeEach: ({ msw }) => {
    msw.use(...attachmentsHandlers);
  },
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
  parameters: { controls: { disable: true }, layout: 'padded' },
  tags: ['autodocs'],
  args: { filtersSlot: null, sessionId: 'draft' },
} satisfies Meta<typeof SessionAttachmentsTab>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Playground: Story = { args: managerProps };

export const Member: Story = {};

export const Empty: Story = { args: { ...managerProps, sessionId: 'empty' } };

export const ManyRows: Story = { args: { ...managerProps, sessionId: 'many-attachments' } };
