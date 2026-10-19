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
    initialValue: { control: 'text' },
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

export const Playground: StoryObj<typeof meta> = {};
