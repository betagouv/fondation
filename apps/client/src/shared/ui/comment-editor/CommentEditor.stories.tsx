import type { Meta, StoryObj } from '@storybook/react-vite';

import { CommentEditor } from './CommentEditor';

const meta = {
  title: 'Shared/CommentEditor',
  component: CommentEditor,
  render: (args) => <CommentEditor key={String(args.initialValue)} {...args} />,
  parameters: { layout: 'padded' },
  tags: ['autodocs'],
  argTypes: {
    ariaLabel: { control: false },
    emptyLabel: { control: false },
    onDirtyChange: { control: false },
    onSave: { control: false },
    initialValue: { control: 'text' },
    placeholder: { control: 'text' },
    readOnly: { control: 'boolean' },
    warning: { control: 'boolean' },
  },
  args: {
    ariaLabel: 'Commentaire',
    emptyLabel: 'Aucun commentaire',
    initialValue: null,
    onSave: async () => {},
    placeholder: 'Saisissez un commentaire…',
    readOnly: false,
    warning: false,
  },
} satisfies Meta<typeof CommentEditor>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Empty: Story = {};

export const Filled: Story = { args: { initialValue: 'Profil solide, expérience pénale confirmée.' } };

export const Warning: Story = { args: { initialValue: 'Brouillon en cours', warning: true } };

export const ReadOnly: Story = { args: { initialValue: 'Commentaire non modifiable.', readOnly: true } };
