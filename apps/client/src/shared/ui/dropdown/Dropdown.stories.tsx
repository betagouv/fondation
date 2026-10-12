import Badge from '@codegouvfr/react-dsfr/Badge';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState, type ReactNode } from 'react';

import { Dropdown, type DropdownOption } from './Dropdown';

type ControlledDropdownProps = {
  className?: string;
  label?: ReactNode;
  multiple?: boolean;
  options?: readonly DropdownOption[];
  placeholder?: ReactNode;
};

const colorOptions: DropdownOption[] = [
  { label: 'Rouge', value: 'red' },
  { label: 'Bleu', value: 'blue' },
  { label: 'Vert', value: 'green' },
];

const statusOptions: DropdownOption[] = [
  { label: <Badge severity="new">Nouveau</Badge>, value: 'new' },
  { label: <Badge severity="info">En cours</Badge>, value: 'progress' },
  { label: <Badge severity="success">Validé</Badge>, value: 'done' },
  { label: <Badge severity="error">Bloqué</Badge>, value: 'blocked' },
];

const rapporteurOptions: DropdownOption[] = Array.from({ length: 14 }, (_, i) => ({
  label: `Rapporteur ${i + 1}`,
  value: `rapporteur-${i + 1}`,
}));

function ControlledDropdown({ multiple, ...args }: ControlledDropdownProps) {
  const options = args.options ?? colorOptions;
  const [single, setSingle] = useState<string | null>(null);
  const [many, setMany] = useState<string[]>([]);

  return multiple ? (
    <Dropdown {...args} multiple onSelect={setMany} options={options} selected={many} />
  ) : (
    <Dropdown {...args} onSelect={setSingle} options={options} selected={single} />
  );
}

const meta = {
  title: 'Shared/Dropdown',
  component: ControlledDropdown,
  parameters: { layout: 'padded' },
  tags: ['autodocs'],
  argTypes: {
    className: { table: { disable: true } },
    label: { control: 'text' },
    multiple: { control: 'boolean' },
    onSelect: { table: { disable: true } },
    options: { table: { disable: true } },
    placeholder: { control: 'text' },
    selected: { table: { disable: true } },
  },
  args: {
    label: 'Couleur',
    multiple: false,
    options: colorOptions,
    placeholder: 'Sélectionner une couleur',
  },
} satisfies Meta<typeof Dropdown>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

export const WithBadges: Story = {
  args: { label: 'Statut', options: statusOptions, placeholder: 'Sélectionner un statut' },
};

export const WithoutLabel: Story = {
  args: { label: undefined },
};

export const ScrollableList: Story = {
  args: {
    label: 'Affecter un rapporteur',
    multiple: true,
    options: rapporteurOptions,
    placeholder: 'Choisir des rapporteurs',
  },
};
