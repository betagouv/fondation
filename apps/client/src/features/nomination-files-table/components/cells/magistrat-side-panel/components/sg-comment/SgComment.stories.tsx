import type { Meta, StoryObj } from '@storybook/react-vite';
import { QueryClient } from '@tanstack/react-query';

import { ArchivedSessionContext } from '@/shared/context/archived-session';
import { StoryQueryClient } from '@/shared/storybook/StoryQueryClient';
import { authKeys } from '@queries/auth.queries';

import { SgComment } from './SgComment';

const VIEWS = ['sg', 'member'] as const;
type View = (typeof VIEWS)[number];

function seed(view: View) {
  return (client: QueryClient) =>
    client.setQueryData(authKeys.introspectSession(), {
      civility: 'Madame ROY',
      firstName: 'Anne',
      id: view === 'sg' ? 'sg-1' : 'member-1',
      isImpersonated: false,
      lastName: 'Roy',
      role: view === 'sg' ? 'ADJOINT_SECRETAIRE_GENERAL' : 'MEMBRE_DU_SIEGE',
    });
}

function SgCommentStory(props: { initialComment: string | null; isArchived: boolean; view: View }) {
  return (
    <StoryQueryClient key={`${props.view}-${props.initialComment}`} seed={seed(props.view)}>
      <ArchivedSessionContext value={{ isArchived: props.isArchived, setIsArchived: () => {} }}>
        <SgComment initialComment={props.initialComment} nominationFileId="file-1" />
      </ArchivedSessionContext>
    </StoryQueryClient>
  );
}

const meta = {
  title: 'Features/MagistratSidePanel/SgComment',
  component: SgCommentStory,
  parameters: {
    layout: 'padded',
    router: { initialEntries: ['/sessions/session-1'], path: '/sessions/:sessionId' },
  },
  tags: ['autodocs'],
  argTypes: {
    initialComment: { control: 'text' },
    isArchived: { control: 'boolean' },
    view: { control: 'inline-radio', options: VIEWS },
  },
  args: { initialComment: null, isArchived: false, view: 'sg' },
} satisfies Meta<typeof SgCommentStory>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

export const MemberReadOnly: Story = {
  args: { initialComment: 'Profil confirmé par le SG, expérience pénale solide.', view: 'member' },
};

export const Archived: Story = { args: { initialComment: 'Figé.', isArchived: true, view: 'sg' } };
