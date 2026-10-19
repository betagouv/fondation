import Button from '@codegouvfr/react-dsfr/Button';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';

import { Modal } from './Modal';

const CONTENTS = {
  long: (
    <div className="flex flex-col gap-4">
      {Array.from({ length: 20 }, (_, index) => (
        <p key={index}>Paragraphe {index + 1} — le contenu défile dans la modale, pas la page.</p>
      ))}
    </div>
  ),
  short: 'Contenu de la modale',
};

function ModalStory(props: {
  actions: 'close' | 'delete' | 'none' | 'save' | 'saveFailed';
  closeOnBackdrop: boolean;
  content: keyof typeof CONTENTS;
  size: 'large' | 'medium';
  title: string;
}) {
  const [open, setOpen] = useState(false);
  const [confirming, setConfirming] = useState(false);

  const save = (
    <>
      <Button priority="secondary">Annuler</Button>
      <Button>Enregistrer</Button>
    </>
  );
  const actions = {
    close: <Button onClick={() => setOpen(false)}>Fermer</Button>,
    delete: <Button onClick={() => setConfirming(true)}>Supprimer</Button>,
    none: undefined,
    save,
    saveFailed: (
      <>
        <p className="fr-error-text fr-mt-0 mr-auto" role="alert">
          L’enregistrement a échoué
        </p>
        {save}
      </>
    ),
  };

  return (
    <div className="fr-p-4v">
      <Button onClick={() => setOpen(true)}>Ouvrir la modale</Button>

      <Modal
        actions={actions[props.actions]}
        closeOnBackdrop={props.closeOnBackdrop}
        onClose={() => setOpen(false)}
        open={open}
        size={props.size}
        title={props.title}
      >
        {CONTENTS[props.content]}
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

const meta = {
  title: 'Shared/Modal',
  component: ModalStory,
  parameters: { layout: 'fullscreen' },
  tags: ['autodocs'],
  argTypes: {
    actions: { control: 'inline-radio', options: ['none', 'save', 'saveFailed', 'close', 'delete'] },
    content: { control: 'inline-radio', options: Object.keys(CONTENTS) },
    size: { control: 'inline-radio', options: ['medium', 'large'] },
  },
  args: {
    actions: 'none',
    closeOnBackdrop: true,
    content: 'short',
    size: 'medium',
    title: 'Titre de la modale',
  },
} satisfies Meta<typeof ModalStory>;

export default meta;

export const Playground: StoryObj<typeof meta> = {};
