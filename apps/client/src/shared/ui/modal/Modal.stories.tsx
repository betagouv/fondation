import Button from '@codegouvfr/react-dsfr/Button';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState, type ComponentProps } from 'react';

import { Modal } from './Modal';

const meta = {
  title: 'Shared/Modal',
  component: Modal,
  parameters: { layout: 'fullscreen' },
  tags: ['autodocs'],
  argTypes: {
    actions: { table: { disable: true } },
    children: { control: 'text' },
    onClose: { table: { disable: true } },
    open: { control: 'boolean' },
    title: { control: 'text' },
  },
  args: {
    children: 'Contenu de la modale',
    onClose: () => {},
    open: true,
    title: 'Titre de la modale',
  },
} satisfies Meta<typeof Modal>;

export default meta;

type Story = StoryObj<typeof meta>;

function ModalDemo(args: ComponentProps<typeof Modal>) {
  const [open, setOpen] = useState(false);

  return (
    <div className="fr-p-4v">
      <Button onClick={() => setOpen(true)}>Ouvrir la modale</Button>

      <Modal {...args} onClose={() => setOpen(false)} open={open} />
    </div>
  );
}

export const Playground: Story = {
  render: (args) => <ModalDemo {...args} />,
};

export const WithActions: Story = {
  args: {
    actions: (
      <>
        <Button priority="secondary">Annuler</Button>
        <Button>Enregistrer</Button>
      </>
    ),
  },
  render: (args) => <ModalDemo {...args} />,
};

export const WithFailedActions: Story = {
  args: {
    actions: (
      <>
        <p className="fr-error-text fr-mt-0 mr-auto" role="alert">
          L’enregistrement a échoué
        </p>

        <Button priority="secondary">Annuler</Button>
        <Button>Enregistrer</Button>
      </>
    ),
  },
  render: (args) => <ModalDemo {...args} />,
};

export const LongContent: Story = {
  args: {
    children: (
      <div className="flex flex-col gap-4">
        {Array.from({ length: 20 }, (_, index) => (
          <p key={index}>Paragraphe {index + 1} — le contenu défile dans la modale, pas la page.</p>
        ))}
      </div>
    ),
    actions: <Button>Fermer</Button>,
  },
  render: (args) => <ModalDemo {...args} />,
};

function StackedModalsDemo(args: ComponentProps<typeof Modal>) {
  const [open, setOpen] = useState(false);
  const [confirming, setConfirming] = useState(false);

  return (
    <div className="fr-p-4v">
      <Button onClick={() => setOpen(true)}>Ouvrir la modale</Button>

      <Modal
        {...args}
        actions={<Button onClick={() => setConfirming(true)}>Supprimer</Button>}
        onClose={() => setOpen(false)}
        open={open}
      >
        Une confirmation peut s’ouvrir par-dessus cette modale.
      </Modal>

      <Modal
        actions={
          <>
            <Button onClick={() => setConfirming(false)} priority="secondary">
              Ne rien faire
            </Button>
            <Button
              onClick={() => {
                setConfirming(false);
                setOpen(false);
              }}
            >
              Confirmer
            </Button>
          </>
        }
        onClose={() => setConfirming(false)}
        open={confirming}
        title="Confirmer la suppression"
      >
        Cette action est irréversible.
      </Modal>
    </div>
  );
}

export const Stacked: Story = {
  render: (args) => <StackedModalsDemo {...args} />,
};
