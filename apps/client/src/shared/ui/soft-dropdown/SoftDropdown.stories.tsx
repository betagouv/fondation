import { Checkbox } from '@codegouvfr/react-dsfr/Checkbox';
import type { Meta, StoryObj } from '@storybook/react-vite';

import { SoftDropdown } from './SoftDropdown';

const shortOptions = ['Étoile', 'Outre-mer', 'Profilé'];
const longOptions = Array.from({ length: 14 }, (_, i) => `Rapporteur ${i + 1}`);

function checkboxes(labels: readonly string[]) {
  return (
    <Checkbox
      options={labels.map((label) => ({ label, nativeInputProps: { defaultChecked: false } }))}
      small
    />
  );
}

const meta = {
  title: 'Shared/SoftDropdown',
  component: SoftDropdown,
  parameters: { layout: 'padded' },
  tags: ['autodocs'],
  argTypes: {
    children: { control: false },
    label: { control: 'text' },
    surfaceClassName: {
      control: 'inline-radio',
      options: ['default', 'sg', 'member'],
      mapping: {
        default: undefined,
        member: 'bg-(--background-action-low-brown-cafe-creme)',
        sg: 'bg-(--background-alt-blue-france)',
      },
    },
  },
  args: { children: checkboxes(shortOptions), label: 'Sélection', surfaceClassName: 'default' },
} satisfies Meta<typeof SoftDropdown>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const ScrollableList: Story = {
  args: { children: checkboxes(longOptions), label: 'Affecter un rapporteur' },
};
