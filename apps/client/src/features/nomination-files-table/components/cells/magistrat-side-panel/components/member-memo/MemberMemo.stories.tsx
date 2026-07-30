import type { Meta, StoryObj } from '@storybook/react-vite';
import { QueryClient } from '@tanstack/react-query';

import { ArchivedSessionContext } from '@/shared/context/archived-session';
import { StoryQueryClient } from '@/shared/storybook/StoryQueryClient';
import { authKeys } from '@queries/auth.queries';

import { MemberMemo } from './MemberMemo';

function seedMember(client: QueryClient) {
  client.setQueryData(authKeys.introspectSession(), {
    civility: 'Monsieur PETIT',
    firstName: 'Jean',
    id: 'member-1',
    isImpersonated: false,
    lastName: 'Petit',
    role: 'MEMBRE_DU_SIEGE',
  });
}

function MemberMemoStory(props: { isArchived: boolean; memo: string | null }) {
  return (
    <StoryQueryClient key={String(props.memo)} seed={seedMember}>
      <ArchivedSessionContext value={{ isArchived: props.isArchived, setIsArchived: () => {} }}>
        <MemberMemo memo={props.memo} nominationFileId="file-1" sessionId="session-1" />
      </ArchivedSessionContext>
    </StoryQueryClient>
  );
}

const meta = {
  title: 'Features/SidePanel/MemberMemo',
  component: MemberMemoStory,
  parameters: { layout: 'padded' },
  tags: ['autodocs'],
  argTypes: { isArchived: { control: 'boolean' }, memo: { control: 'text' } },
  args: { isArchived: false, memo: null },
} satisfies Meta<typeof MemberMemoStory>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Empty: Story = {};

export const Filled: Story = {
  args: { memo: 'À recontacter sur sa mobilité géographique avant la prochaine session.' },
};

export const Archived: Story = {
  args: { isArchived: true, memo: 'Note conservée mais non modifiable sur une session archivée.' },
};
