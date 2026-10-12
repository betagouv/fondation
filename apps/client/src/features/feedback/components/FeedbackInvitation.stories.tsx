import type { Meta, StoryObj } from '@storybook/react-vite';
import { useEffect } from 'react';

import { useAskForFeedback } from '@/features/feedback/hooks/useAskForFeedback';
import { ConfirmModalProvider } from '@/shared/context/confirm-modal';

function FeedbackModalStory() {
  const askForFeedback = useAskForFeedback();

  useEffect(() => {
    void askForFeedback();
  }, [askForFeedback]);

  return null;
}

const meta = {
  component: FeedbackModalStory,
  decorators: [
    (Story) => (
      <ConfirmModalProvider>
        <Story />
      </ConfirmModalProvider>
    ),
  ],
  parameters: {
    docs: {
      description: {
        component:
          "Invitation à donner son avis. Elle n'apparaît jamais à l'ouverture de Fondation : après 5 minutes dans l'onglet, au premier changement de page. Jusqu'au 31 octobre 2026, elle revient tous les 2 jours tant que la personne n'a pas répondu et plus du tout une fois qu'elle a répondu. Ensuite, elle revient 30 jours après chaque avis et 7 jours après un \"Répondre ultérieurement\". Jamais pour un administrateur ni pendant une usurpation.",
      },
      // a modal covers the whole page: in its own frame, it stays out of the documentation
      story: { iframeHeight: 420, inline: false },
    },
    layout: 'fullscreen',
  },
  tags: ['autodocs'],
  title: 'Features/Feedback/Modal',
} satisfies Meta<typeof FeedbackModalStory>;

export default meta;

export const Default: StoryObj<typeof meta> = {};
