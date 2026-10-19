import Badge from '@codegouvfr/react-dsfr/Badge';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';

import { Dropdown, type DropdownOption } from './Dropdown';

const LISTS = {
  colors: {
    label: 'Couleur',
    options: [
      { label: 'Rouge', value: 'red' },
      { label: 'Bleu', value: 'blue' },
      { label: 'Vert', value: 'green' },
    ],
    placeholder: 'Sélectionner une couleur',
  },
  rapporteurs: {
    label: 'Affecter un rapporteur',
    options: Array.from({ length: 14 }, (_, i) => ({
      label: `Rapporteur ${i + 1}`,
      value: `rapporteur-${i + 1}`,
    })),
    placeholder: 'Choisir des rapporteurs',
  },
  statuses: {
    label: 'Statut',
    options: [
      { label: <Badge severity="new">Nouveau</Badge>, value: 'new' },
      { label: <Badge severity="info">En cours</Badge>, value: 'progress' },
      { label: <Badge severity="success">Validé</Badge>, value: 'done' },
      { label: <Badge severity="error">Bloqué</Badge>, value: 'blocked' },
    ],
    placeholder: 'Sélectionner un statut',
  },
} satisfies Record<string, { label: string; options: DropdownOption[]; placeholder: string }>;

type List = keyof typeof LISTS;

function DropdownStory(props: { disabled: boolean; list: List; multiple: boolean; withLabel: boolean }) {
  const { label, options, placeholder } = LISTS[props.list];
  const [single, setSingle] = useState<string | null>(null);
  const [many, setMany] = useState<string[]>([]);
  const shared = {
    disabled: props.disabled,
    label: props.withLabel ? label : undefined,
    options,
    placeholder,
  };

  return props.multiple ? (
    <Dropdown {...shared} multiple onSelect={setMany} selected={many} />
  ) : (
    <Dropdown {...shared} onSelect={setSingle} selected={single} />
  );
}

const meta = {
  title: 'Shared/Dropdown',
  component: DropdownStory,
  render: (args) => <DropdownStory key={`${args.list}-${args.multiple}`} {...args} />,
  parameters: { layout: 'padded' },
  tags: ['autodocs'],
  argTypes: {
    list: { control: 'inline-radio', options: Object.keys(LISTS) },
  },
  args: {
    disabled: false,
    list: 'colors',
    multiple: false,
    withLabel: true,
  },
} satisfies Meta<typeof DropdownStory>;

export default meta;

export const Playground: StoryObj<typeof meta> = {};
