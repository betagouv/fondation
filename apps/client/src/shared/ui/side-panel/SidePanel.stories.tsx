import Button from '@codegouvfr/react-dsfr/Button';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState, type ComponentProps } from 'react';

import { SidePanel } from './SidePanel';

function SidePanelDemo(args: ComponentProps<typeof SidePanel>) {
  const [open, setOpen] = useState(args.open);

  return (
    <div className="fr-p-4v">
      <Button aria-controls={args.id} onClick={() => setOpen(true)}>
        Ouvrir le panneau
      </Button>

      <SidePanel {...args} onClose={() => setOpen(false)} open={open} />
    </div>
  );
}

const meta = {
  title: 'Shared/SidePanel',
  component: SidePanel,
  render: (args) => <SidePanelDemo key={String(args.open)} {...args} />,
  parameters: { layout: 'fullscreen' },
  tags: ['autodocs'],
  argTypes: {
    ariaLabel: { table: { disable: true } },
    ariaLabelledBy: { table: { disable: true } },
    children: { control: 'text' },
    disableClose: { control: 'boolean' },
    header: { table: { disable: true } },
    id: { table: { disable: true } },
    onClose: { table: { disable: true } },
    open: { control: 'boolean' },
  },
  args: {
    ariaLabel: 'Panneau de démonstration',
    children: 'Contenu du panneau latéral',
    disableClose: false,
    header: <span className="pl-4 text-xl font-semibold">Titre du panneau</span>,
    id: 'demo-side-panel',
    onClose: () => {},
    open: true,
  },
} satisfies Meta<typeof SidePanel>;

export default meta;

export const Playground: StoryObj<typeof meta> = {};
