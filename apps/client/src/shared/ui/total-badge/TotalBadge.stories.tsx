import type { Meta, StoryObj } from '@storybook/react-vite';

import { TotalBadge } from './TotalBadge';

const SEVERITIES = ['warning', 'info', 'success', 'error', 'new'] as const;

const meta = {
  title: 'Shared/TotalBadge',
  component: TotalBadge,
  parameters: {
    controls: { include: ['children', 'severity', 'value'] },
    layout: 'padded',
  },
  tags: ['autodocs'],
  argTypes: {
    children: { control: 'text' },
    severity: {
      control: 'inline-radio',
      mapping: { aucune: undefined },
      options: ['aucune', ...SEVERITIES],
    },
    value: { control: 'text' },
  },
  args: { children: 'Total', value: '12' },
} satisfies Meta<typeof TotalBadge>;

export default meta;

export const Playground: StoryObj<typeof meta> = {};
