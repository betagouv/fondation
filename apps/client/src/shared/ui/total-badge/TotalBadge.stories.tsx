import type { Meta, StoryObj } from '@storybook/react-vite';

import { formatFileSize } from '@/utils/file.utils';

import { TotalBadge } from './TotalBadge';

const SEVERITIES = ['warning', 'info', 'success', 'error', 'new'] as const;

function Totals() {
  return (
    <div className="flex items-center gap-6">
      <TotalBadge value={12}>Total</TotalBadge>
      <TotalBadge value={4}>ODJ</TotalBadge>
      <TotalBadge value={8}>PV</TotalBadge>
      <TotalBadge value={formatFileSize(1_300_000)}>Taille</TotalBadge>
    </div>
  );
}

function StatusCounts() {
  return (
    <div className="flex items-center gap-6">
      <TotalBadge value={24}>Total</TotalBadge>
      <TotalBadge severity="warning" value={6}>
        À affecter
      </TotalBadge>
      <TotalBadge severity="info" value={12}>
        En cours
      </TotalBadge>
      <TotalBadge severity="success" value={6}>
        Issues renseignées
      </TotalBadge>
    </div>
  );
}

const meta = {
  title: 'Shared/TotalBadge',
  component: TotalBadge,
  parameters: {
    controls: { include: ['children', 'severity', 'value'] },
    layout: 'padded',
  },
  tags: ['autodocs'],
  argTypes: {
    severity: {
      control: 'inline-radio',
      mapping: { aucune: undefined },
      options: ['aucune', ...SEVERITIES],
    },
  },
  args: { children: 'Total', value: 12 },
} satisfies Meta<typeof TotalBadge>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

export const FormattedValue: Story = {
  args: { children: 'Taille', value: formatFileSize(1_300_000) },
};

export const SummaryRow: Story = {
  parameters: { controls: { disable: true } },
  render: () => <Totals />,
};

export const StatusRow: Story = {
  parameters: { controls: { disable: true } },
  render: () => <StatusCounts />,
};
