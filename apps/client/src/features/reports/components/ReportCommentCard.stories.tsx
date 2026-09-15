import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn } from 'storybook/test';

import { ReportCommentCard } from './ReportCommentCard';

const comment = [
  `<p>Maurice Ravel, 49 ans, est conseiller à la cour d'appel de Bastia depuis septembre 2023. Son parcours combine des fonctions de siège pénal (juge à Marseille, puis vice-président) et une expérience de la juridiction du second degré. Durée sur poste : 4 ans et 5 mois.</p>`,
  `<p>Le magistrat justifie d'une solide pratique du contentieux pénal, acquise notamment dans ses fonctions marseillaises. Ses évaluations font état d'une capacité de travail soutenue. [à compléter : autorité dans l'animation d'une formation collégiale, maîtrise procédurale]</p>`,
  `<p><em>Point de vigilance :</em> [à rédiger]</p>`,
  `<p><em>Avis :</em> [à rédiger]</p>`,
].join('');

const meta = {
  title: 'Features/ReportDetails/CommentCard',
  component: ReportCommentCard,
  parameters: { controls: { include: ['isReadOnly'] }, layout: 'padded' },
  tags: ['autodocs'],
  args: { comment, isReadOnly: false, onUpdate: fn().mockName('onUpdate') },
} satisfies Meta<typeof ReportCommentCard>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

export const Empty: Story = {
  args: { comment: null },
};

export const ArchivedSession: Story = {
  args: { isReadOnly: true },
};
