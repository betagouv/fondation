import Button from '@codegouvfr/react-dsfr/Button';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState, type ComponentProps } from 'react';

import { SidePanel } from './SidePanel';

const meta = {
  title: 'Shared/SidePanel',
  component: SidePanel,
  parameters: { layout: 'fullscreen' },
  tags: ['autodocs'],
  argTypes: {
    ariaLabel: { control: false },
    ariaLabelledBy: { control: false },
    children: { control: 'text' },
    header: { control: false },
    id: { control: false },
    onClose: { control: false },
    open: { control: 'boolean' },
  },
  args: {
    ariaLabel: 'Panneau de démonstration',
    children: 'Contenu du panneau latéral',
    header: <span className="pl-4 text-xl font-semibold">Titre du panneau</span>,
    id: 'demo-side-panel',
    onClose: () => {},
    open: true,
  },
} satisfies Meta<typeof SidePanel>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

function SidePanelDemo(args: ComponentProps<typeof SidePanel>) {
  const [open, setOpen] = useState(false);

  return (
    <div className="fr-p-4v">
      <Button aria-controls={args.id} onClick={() => setOpen(true)}>
        Ouvrir le panneau
      </Button>

      <SidePanel {...args} onClose={() => setOpen(false)} open={open} />
    </div>
  );
}

export const Default: Story = {
  render: (args) => <SidePanelDemo {...args} />,
};
