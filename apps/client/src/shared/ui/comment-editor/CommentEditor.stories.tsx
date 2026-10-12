import type { Meta, StoryObj } from '@storybook/react-vite';

import { CommentEditor } from './CommentEditor';

const meta = {
  title: 'Shared/CommentEditor',
  component: CommentEditor,
  render: (args) => <CommentEditor key={String(args.initialValue)} {...args} />,
  parameters: { layout: 'padded' },
  tags: ['autodocs'],
  argTypes: {
    ariaLabel: { table: { disable: true } },
    emptyLabel: { table: { disable: true } },
    initialValue: { table: { disable: true } },
    onDirtyChange: { table: { disable: true } },
    onSave: { table: { disable: true } },
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

export const Playground: Story = {};

export const Warning: Story = { args: { initialValue: 'Brouillon en cours', warning: true } };

export const ReadOnly: Story = { args: { initialValue: 'Commentaire non modifiable.', readOnly: true } };
