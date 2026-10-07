import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn } from 'storybook/test';

import { ConfirmModalProvider } from '@/shared/context/confirm-modal';

import { AdminFeedbackForm } from './AdminFeedbackForm';
import { FeedbackForm } from './FeedbackForm';
import { FeedbackLastAnswerNotice } from './FeedbackLastAnswerNotice';
import { FeedbackThanks } from './FeedbackThanks';

const VIEWS = ['admin', 'member', 'sg'] as const;
type View = (typeof VIEWS)[number];

function FeedbackFormStory(props: {
  hasAnswered: boolean;
  isSent: boolean;
  isTestEnvironment: boolean;
  onSubmit: () => void;
  view: View;
}) {
  if (props.isSent) return <FeedbackThanks />;
  if (props.view === 'admin')
    return (
      <AdminFeedbackForm
        key={String(props.isTestEnvironment)}
        onSubmit={props.isTestEnvironment ? props.onSubmit : undefined}
        questionnaire="SECRETARIAT"
      />
    );

  return (
    <>
      {props.hasAnswered && <FeedbackLastAnswerNotice answeredOn={{ day: 1, month: 10, year: 2026 }} />}
      <FeedbackForm
        isSubmitting={false}
        key={props.view}
        onSubmit={props.onSubmit}
        questionnaire={props.view === 'sg' ? 'SECRETARIAT' : 'MEMBER'}
      />
    </>
  );
}

const meta = {
  argTypes: {
    hasAnswered: { control: 'boolean' },
    isSent: { control: 'boolean' },
    isTestEnvironment: { control: 'boolean' },
    onSubmit: { control: false },
    view: { control: 'inline-radio', options: VIEWS },
  },
  args: { hasAnswered: false, isSent: false, isTestEnvironment: false, onSubmit: fn(), view: 'member' },
  component: FeedbackFormStory,
  decorators: [
    (Story) => (
      <ConfirmModalProvider>
        <div className="fr-container fr-py-6v max-w-3xl">
          <Story />
        </div>
      </ConfirmModalProvider>
    ),
  ],
  parameters: {
    docs: {
      description: {
        component:
          "Questionnaire en étapes, une question par étape : 6 pour les membres, 5 pour le secrétariat général. Le formulaire est toujours vide, pour ne pas orienter la personne vers ses réponses précédentes. Une personne qui a déjà répondu, membre ou secrétariat général, voit la date de sa dernière réponse au-dessus du questionnaire. En production, un administrateur, y compris quand il usurpe un compte, ne fait que parcourir les deux questionnaires sans rien enregistrer. En local et en recette (isTestEnvironment), ses réponses sont enregistrées pour tester l'envoi et l'export Excel.",
      },
    },
  },
  tags: ['autodocs'],
  title: 'Features/Feedback/Form',
} satisfies Meta<typeof FeedbackFormStory>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Member: Story = {};

export const Sg: Story = { args: { view: 'sg' } };

export const Admin: Story = { args: { view: 'admin' } };
