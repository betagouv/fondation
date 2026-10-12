import Tag from '@codegouvfr/react-dsfr/Tag';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn } from 'storybook/test';

import { StoryQueryClient } from '@/shared/storybook/StoryQueryClient';
import { authKeys } from '@queries/auth.queries';

import { FileList, FileListItem } from './FileList';

const CURRENT_USER = {
  civility: 'Madame BERNARD',
  firstName: 'Sophie',
  id: 'sg-1',
  isImpersonated: false,
  lastName: 'Bernard',
  role: 'ADJOINT_SECRETAIRE_GENERAL',
};

const meta = {
  args: {
    addedAt: '2026-06-18T08:30:00.000Z',
    addedBy: { id: 'user-2', name: 'Léa MARTIN' },
    disabled: false,
    name: 'cv-camille-durand.pdf',
    onDelete: fn().mockName('onDelete'),
    onDownload: fn().mockName('onDownload'),
    onOpen: fn().mockName('onOpen'),
    size: 248_900,
  },
  argTypes: {
    children: { table: { disable: true } },
    header: { table: { disable: true } },
  },
  component: FileListItem,
  decorators: [
    (Story) => (
      <StoryQueryClient seed={(client) => client.setQueryData(authKeys.introspectSession(), CURRENT_USER)}>
        <div className="max-w-2xl">
          <FileList>
            <Story />
          </FileList>
        </div>
      </StoryQueryClient>
    ),
  ],
  parameters: { layout: 'padded' },
  tags: ['autodocs'],
  title: 'Shared/FileList',
} satisfies Meta<typeof FileListItem>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

export const AddedByCurrentUser: Story = {
  args: { addedBy: { id: CURRENT_USER.id, name: 'Sophie BERNARD' } },
};

export const Disabled: Story = {
  args: { disabled: true },
};

export const LongName: Story = {
  args: {
    name: 'proces-verbal-de-la-commission-d-avancement-du-conseil-superieur-de-la-magistrature-session-de-printemps-2026-version-definitive-signee.pdf',
  },
};

export const ReadOnly: Story = {
  render: ({ onDelete: _onDelete, ...args }) => <FileListItem {...args} />,
};

export const SeveralFiles: Story = {
  render: (args) => (
    <>
      <FileListItem {...args} />
      <FileListItem
        {...args}
        addedAt="2026-06-19T14:10:00.000Z"
        addedBy={{ id: CURRENT_USER.id, name: 'Sophie BERNARD' }}
        name="lettre-de-motivation.docx"
        size={51_200}
      />
      <FileListItem
        {...args}
        addedAt="2026-06-20T09:45:00.000Z"
        addedBy={null}
        name="photo-identite.png"
        size={null}
      />
    </>
  ),
};

export const UnknownAuthor: Story = {
  args: { addedBy: null },
};

export const UnknownSize: Story = {
  args: { size: null },
};

export const WithHeader: Story = {
  args: { header: <Tag small>Note d'intention</Tag> },
};

export const WithoutExtension: Story = {
  args: { name: 'releve-de-decisions' },
};
