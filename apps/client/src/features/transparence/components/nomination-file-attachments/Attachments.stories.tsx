import type { Meta, StoryObj } from '@storybook/react-vite';
import { http, HttpResponse } from 'msw';
import { useEffect } from 'react';
import { useNavigate } from 'react-router';

import { ConfirmModalProvider } from '@/shared/context/confirm-modal';
import { StoryQueryClient } from '@/shared/storybook/StoryQueryClient';
import { ROUTE_PATHS } from '@/utils/route-path.utils';
import type { ListedNominationFileAttachmentDto } from '@api/types';

import { Attachments } from './Attachments';
import { AddNominationFileAttachmentModalProvider } from './context/AddNominationFileAttachmentModalProvider';

const SESSION_ID = 'session-1';

const SAMPLE_FILES: ListedNominationFileAttachmentDto['items'] = [
  {
    addedAt: '2026-06-18T08:30:00.000Z',
    addedBy: { id: 'user-1', name: 'Léa MARTIN' },
    id: 'a1',
    name: 'cv-camille-durand.pdf',
    size: 248_900,
    type: 'FICHE_DE_JURIDICTION',
  },
  {
    addedAt: '2026-06-18T08:30:00.000Z',
    addedBy: { id: 'user-1', name: 'Léa MARTIN' },
    id: 'a2',
    name: 'lettre-de-motivation.pdf',
    size: 51_200,
    type: 'NOTE_INTENTION',
  },
  {
    addedAt: '2026-06-19T08:30:00.000Z',
    addedBy: { id: 'user-1', name: 'Léa MARTIN' },
    id: 'a3',
    name: 'photo-identite.png',
    size: null,
    type: 'AUTRE',
  },
];

const VIEWS = ['sg', 'member'] as const;
type View = (typeof VIEWS)[number];

type AttachmentsArgs = { hasFiles: boolean; isUpdatable: boolean; view: View };

const attachmentsByNominationFile = new Map<string, ListedNominationFileAttachmentDto['items']>();

const nominationFileIdFor = (args: AttachmentsArgs) =>
  `file-${args.view}-${args.hasFiles}-${args.isUpdatable}`;

const attachmentsOf = (nominationFileId: string) => attachmentsByNominationFile.get(nominationFileId) ?? [];

const attachmentHandlers = [
  http.get('*/api/sessions/v2/:sessionId/files/:nominationFileId/attachments', ({ params }) =>
    HttpResponse.json<ListedNominationFileAttachmentDto>({
      items: attachmentsOf(String(params.nominationFileId)),
    }),
  ),
  http.put(
    '*/api/sessions/v2/:sessionId/files/:nominationFileId/attachments',
    async ({ params, request }) => {
      const nominationFileId = String(params.nominationFileId);
      const formData = await request.formData();
      const { type } = JSON.parse(await (formData.get('form') as Blob).text());
      const uploaded = formData
        .getAll('files')
        .filter((file): file is File => file instanceof File)
        .map((file) => ({
          addedAt: new Date().toISOString(),
          addedBy: { id: 'user-1', name: 'Léa MARTIN' },
          id: crypto.randomUUID(),
          name: file.name,
          size: file.size,
          type,
        }));

      attachmentsByNominationFile.set(nominationFileId, [...attachmentsOf(nominationFileId), ...uploaded]);
      return new HttpResponse(null, { status: 204 });
    },
  ),
  http.delete('*/api/sessions/v2/:sessionId/files/:nominationFileId/attachments/:fileId', ({ params }) => {
    const nominationFileId = String(params.nominationFileId);
    attachmentsByNominationFile.set(
      nominationFileId,
      attachmentsOf(nominationFileId).filter(({ id }) => id !== params.fileId),
    );
    return new HttpResponse(null, { status: 204 });
  }),
];

function AttachmentsStory(props: AttachmentsArgs) {
  const navigate = useNavigate();
  useEffect(() => {
    navigate(props.view === 'sg' ? ROUTE_PATHS.SG.DASHBOARD : ROUTE_PATHS.TRANSPARENCES.DASHBOARD);
  }, [props.view, navigate]);

  return (
    <StoryQueryClient>
      <ConfirmModalProvider>
        <AddNominationFileAttachmentModalProvider>
          <Attachments
            isUpdatable={props.isUpdatable}
            nominationFileId={nominationFileIdFor(props)}
            sessionId={SESSION_ID}
          />
        </AddNominationFileAttachmentModalProvider>
      </ConfirmModalProvider>
    </StoryQueryClient>
  );
}

const meta = {
  args: { hasFiles: true, isUpdatable: true, view: 'sg' },
  argTypes: {
    hasFiles: { control: 'boolean' },
    isUpdatable: { control: 'boolean' },
    view: { control: 'inline-radio', options: VIEWS },
  },
  beforeEach: ({ args, msw }) => {
    msw.use(...attachmentHandlers);

    const nominationFileId = nominationFileIdFor(args);
    attachmentsByNominationFile.set(nominationFileId, args.hasFiles ? [...SAMPLE_FILES] : []);
    return () => {
      attachmentsByNominationFile.delete(nominationFileId);
    };
  },
  component: AttachmentsStory,
  parameters: { layout: 'padded' },
  tags: ['autodocs'],
  title: 'Features/SidePanel/Attachments',
} satisfies Meta<typeof AttachmentsStory>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

export const MemberWithFiles: Story = { args: { view: 'member' } };

export const SecretaireGeneralEmpty: Story = { args: { hasFiles: false } };
