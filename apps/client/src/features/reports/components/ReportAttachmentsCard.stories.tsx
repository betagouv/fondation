import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn } from 'storybook/test';

import { ReportAttachmentsCard } from './ReportAttachmentsCard';

const meta = {
  title: 'Features/ReportDetails/AttachmentsCard',
  component: ReportAttachmentsCard,
  parameters: { controls: { include: ['isPending', 'isReadOnly'] }, layout: 'padded' },
  tags: ['autodocs'],
  args: { isPending: false, isReadOnly: false, onFilesAttached: fn().mockName('onFilesAttached') },
} satisfies Meta<typeof ReportAttachmentsCard>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

export const Uploading: Story = {
  args: { isPending: true },
};

export const ArchivedSession: Story = {
  args: { isReadOnly: true },
};
