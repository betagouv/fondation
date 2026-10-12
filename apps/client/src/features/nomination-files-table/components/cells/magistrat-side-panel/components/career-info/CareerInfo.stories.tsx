import type { Meta, StoryObj } from '@storybook/react-vite';

import { makeSessionNominationFile } from '@/test-utils/factories/session-nomination-file.factory';

import { CareerInfo } from './CareerInfo';

const meta = {
  title: 'Features/SidePanel/CareerInfo',
  component: CareerInfo,
  parameters: { layout: 'padded' },
  tags: ['autodocs'],
  argTypes: { content: { table: { disable: true } } },
} satisfies Meta<typeof CareerInfo>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Playground: Story = {
  args: {
    content: makeSessionNominationFile({
      content: {
        datePriseDeFonctionPosteActuel: { year: 2019, month: 9, day: 1 },
        rang: '(2 sur 47)',
      },
    }).content,
  },
};
