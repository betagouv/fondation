import type { Meta, StoryObj } from '@storybook/react-vite';

import { ReporterTag } from './ReporterTag';

const meta = {
  title: 'Shared/ReporterTag',
  component: ReporterTag,
  parameters: { layout: 'padded' },
  tags: ['autodocs'],
  argTypes: {
    enableTooltip: { control: 'boolean' },
    excludedTitle: { control: 'text' },
    isCurrentUser: { control: 'boolean' },
    reporter: { table: { disable: true } },
  },
  args: {
    enableTooltip: true,
    isCurrentUser: false,
    reporter: { firstName: 'Honorine', lastName: 'Valrose' },
  },
} satisfies Meta<typeof ReporterTag>;

export default meta;

export const Playground: StoryObj<typeof meta> = {};
