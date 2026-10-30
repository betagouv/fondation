import Button from '@codegouvfr/react-dsfr/Button';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { http, HttpResponse } from 'msw';
import { fn } from 'storybook/test';

import { ConfirmModalProvider } from '@/shared/context/confirm-modal';
import { STORY_VIEWS, type StoryView } from '@/shared/storybook/story-users';
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
    addedAt: '2028-02-04T08:30:00.000Z',
    addedBy: { id: 'user-1', name: 'Léa MARTIN' },
    id: 'file-1',
    name: 'Fiche de juridiction CA DOUAI.pdf',
    size: 248_000,
  },
  {
    addedAt: '2028-02-11T08:30:00.000Z',
    addedBy: { id: 'user-1', name: 'Léa MARTIN' },
    id: 'file-2',
    name: 'Note DSJ - évaluations manquantes.pdf',
    size: 1_240_000,
  },
  {
    addedAt: '2028-03-02T08:30:00.000Z',
    addedBy: { id: 'user-1', name: 'Léa MARTIN' },
    id: 'file-3',
    name: 'Tableau des effectifs 2028.xlsx',
    size: 86_000,
  },
];

const MANY_ATTACHMENTS: Attachments = Array.from({ length: 100 }, (_, index) => ({
  addedAt: new Date(Date.UTC(2028, index % 12, (index % 28) + 1, 8, 30)).toISOString(),
  addedBy: null,
  id: `file-${index}`,
  name: `Fiche de juridiction ${index + 1}.pdf`,
  size: 120_000 + index * 4_096,
}));

const sessions: Record<string, Attachments> = {
  empty: [],
  few: ATTACHMENTS,
  many: MANY_ATTACHMENTS,
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

// as the transparence page: only the SG adds or deletes an attachment, and not once the session is archived
function SessionAttachmentsTabStory(props: { isArchived: boolean; sessionId: string; view: StoryView }) {
  const canManage = props.view === 'sg' && !props.isArchived;

  return (
    <StoryQueryClient>
      <ToastProvider>
        <ConfirmModalProvider>
          <SessionAttachmentsTab
            extraActions={
              canManage
                ? (attachment) => (
                    <DeleteFileButton fileName={attachment.name} onDelete={() => onDelete(attachment.name)} />
                  )
                : undefined
            }
            filtersSlot={null}
            headerEnd={
              canManage && (
                <Button
                  className="py-2!"
                  iconId="fr-icon-add-line"
                  onClick={onImport}
                  priority="primary"
                  size="small"
                >
                  Ajouter une pièce jointe
                </Button>
              )
            }
            sessionId={props.sessionId}
          />
        </ConfirmModalProvider>
      </ToastProvider>
    </StoryQueryClient>
  );
}

const meta = {
  args: { isArchived: false, sessionId: 'few', view: 'sg' },
  argTypes: {
    sessionId: { control: 'inline-radio', options: Object.keys(sessions) },
    view: { control: 'inline-radio', options: STORY_VIEWS },
  },
  beforeEach: ({ msw }) => {
    msw.use(...attachmentsHandlers);
  },
  component: SessionAttachmentsTabStory,
  parameters: { layout: 'padded' },
  title: 'Session/Transparence/SessionAttachmentsTable',
} satisfies Meta<typeof SessionAttachmentsTabStory>;

export default meta;

export const Playground: StoryObj<typeof meta> = {};
