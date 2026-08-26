import { Toast as BaseToast } from '@base-ui/react/toast';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { useEffect, useId, useRef, type PropsWithChildren } from 'react';

import { ToastProvider } from './ToastRegion';

type Sample = {
  actionLabel?: string;
  description?: string;
  title: string;
  tone: 'error' | 'success';
};

function PinnedToast(props: Sample) {
  const manager = BaseToast.useToastManager();
  const managerRef = useRef(manager);
  managerRef.current = manager;

  const id = useId();
  const { actionLabel, description, title, tone } = props;

  useEffect(() => {
    managerRef.current.add({
      actionProps: actionLabel ? { children: actionLabel, onClick: () => {} } : undefined,
      description,
      id,
      timeout: 0,
      title,
      type: tone,
    });
  }, [actionLabel, description, id, title, tone]);

  return null;
}

function Page(props: PropsWithChildren) {
  return (
    <div className="fr-p-8v flex min-h-screen flex-col gap-4 bg-(--background-alt-grey)">
      <h1 className="fr-m-0 fr-h4">Contenu de la page</h1>
      <p className="fr-m-0 max-w-2xl text-(--text-mention-grey)">
        Les notifications s’affichent en surimpression, en bas à droite, sans décaler ce contenu. Elles
        restent affichées en permanence ici : le minutage est couvert par les tests.
      </p>

      {props.children}
    </div>
  );
}

function ToastPlayground(props: Sample) {
  return (
    <Page>
      <PinnedToast {...props} />
    </Page>
  );
}

const meta = {
  title: 'Shared/Toast',
  component: ToastPlayground,
  parameters: { controls: { sort: 'alpha' }, layout: 'fullscreen' },
  decorators: [
    (Story) => (
      <ToastProvider>
        <Story />
      </ToastProvider>
    ),
  ],
  argTypes: {
    actionLabel: { control: 'text' },
    description: { control: 'text' },
    title: { control: 'text' },
    tone: { control: 'inline-radio', options: ['success', 'error'] },
  },
  args: {
    title: 'Session publiée avec succès',
    tone: 'success',
  },
} satisfies Meta<typeof ToastPlayground>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

export const LongConfirmation: Story = {
  args: {
    description: 'Les membres de la formation peuvent désormais consulter leurs affectations.',
    title: '12 propositions ajoutées à l’ordre du jour en préparation',
  },
};

export const WithAction: Story = {
  args: {
    actionLabel: 'Voir l’ODJ',
    title: '3 propositions ajoutées à l’ODJ en préparation',
  },
};

export const Failure: Story = {
  args: {
    description: 'Réessayez et prévenez le support si cela persiste.',
    title: 'Le document n’a pas pu être ouvert',
    tone: 'error',
  },
};

export const FullQueue: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <Page>
      <PinnedToast title="Session publiée avec succès" tone="success" />
      <PinnedToast
        description="Réessayez et prévenez le support si cela persiste."
        title="Le document n’a pas pu être ouvert"
        tone="error"
      />
      <PinnedToast
        actionLabel="Voir l’ODJ"
        title="3 propositions ajoutées à l’ODJ en préparation"
        tone="success"
      />
    </Page>
  ),
};
