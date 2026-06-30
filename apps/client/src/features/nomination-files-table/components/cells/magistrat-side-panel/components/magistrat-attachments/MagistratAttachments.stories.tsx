import type { Meta, StoryObj } from '@storybook/react-vite';
import { QueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { useNavigate } from 'react-router';

import { ConfirmationProvider } from '@/shared/context/confirmation';
import { StoryQueryClient } from '@/shared/storybook/StoryQueryClient';
import { ROUTE_PATHS } from '@/utils/route-path.utils';
import { sessionKeys } from '@queries/nomination-sessions.queries';

import { MagistratAttachments } from './MagistratAttachments';

const SESSION_ID = 'session-1';
const NOMINATION_FILE_ID = 'file-1';

const SAMPLE_FILES = [
  { id: 'a1', name: 'cv-camille-durand.pdf', size: 248_900 },
  { id: 'a2', name: 'lettre-de-motivation.pdf', size: 51_200 },
  { id: 'a3', name: 'photo-identite.png', size: null },
];

const VIEWS = ['sg', 'member'] as const;
type View = (typeof VIEWS)[number];

function MagistratAttachmentsStory(props: { hasFiles: boolean; isArchived: boolean; view: View }) {
  const navigate = useNavigate();
  useEffect(() => {
    navigate(props.view === 'sg' ? ROUTE_PATHS.SG.DASHBOARD : ROUTE_PATHS.TRANSPARENCES.DASHBOARD);
  }, [props.view, navigate]);

  const seed = (client: QueryClient) =>
    client.setQueryData(
      sessionKeys.listNominationFileAttachments({
        nominationFileId: NOMINATION_FILE_ID,
        sessionId: SESSION_ID,
      }),
      { items: props.hasFiles ? SAMPLE_FILES : [] },
    );

  return (
    <StoryQueryClient key={String(props.hasFiles)} seed={seed}>
      <ConfirmationProvider>
        <MagistratAttachments
          isArchived={props.isArchived}
          nominationFileId={NOMINATION_FILE_ID}
          sessionId={SESSION_ID}
        />
      </ConfirmationProvider>
    </StoryQueryClient>
  );
}

const meta = {
  title: 'Features/Magistrat/MagistratAttachments',
  component: MagistratAttachmentsStory,
  parameters: { layout: 'padded' },
  tags: ['autodocs'],
  argTypes: {
    hasFiles: { control: 'boolean' },
    isArchived: { control: 'boolean' },
    view: { control: 'inline-radio', options: VIEWS },
  },
  args: { hasFiles: true, isArchived: false, view: 'sg' },
} satisfies Meta<typeof MagistratAttachmentsStory>;

export default meta;

type Story = StoryObj<typeof meta>;

export const SecretaireGeneralWithFiles: Story = {};

export const SecretaireGeneralEmpty: Story = { args: { hasFiles: false } };

export const MemberWithFiles: Story = { args: { view: 'member' } };

export const MemberEmpty: Story = { args: { hasFiles: false, view: 'member' } };
