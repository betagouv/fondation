import type { Meta, StoryObj } from '@storybook/react-vite';

import { Upload } from './Upload';

const meta = {
  title: 'Shared/Upload',
  component: Upload,
  tags: ['autodocs'],
  argTypes: {
    onChange: { table: { disable: true } },
  },
  args: {
    hint: 'Formats supportés : png, jpeg et pdf',
    label: 'Importer un fichier',
    multiple: true,
    onChange: () => {},
  },
} satisfies Meta<typeof Upload>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

export const Pending: Story = {
  args: { isPending: true },
};

export const Failed: Story = {
  args: { hasError: true },
};
