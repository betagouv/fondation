import type { Meta, StoryObj } from '@storybook/react-vite';
import { http, HttpResponse } from 'msw';
import { useState } from 'react';

import { ConfirmModalProvider } from '@/shared/context/confirm-modal';
import { StoryQueryClient } from '@/shared/storybook/StoryQueryClient';
import { ToastProvider } from '@/shared/ui/toast';

import { type EditedPosition, PositionVacancySidePanel } from './PositionVacancySidePanel';
import { positionVacancyHandlers, storyHolderOf } from './veille-des-postes.story-fixtures';

const EDITED: EditedPosition = {
  ...storyHolderOf(2, { held: true, movesAfterSevenYears: true }),
  commented: { courtId: 'CA  AMIENS' },
  courtLabel: "Cour d'appel d'Amiens",
  id: 'magistrat-2',
  installationDate: { day: 1, month: 9, year: 2021 },
  magistrat: {
    id: 'magistrat-2',
    name: 'CARON Hélène',
    title: "Première présidente de la cour d'appel d'Amiens",
  },
};

const VACANT: EditedPosition = {
  ...storyHolderOf(9, { held: false, movesAfterSevenYears: true }),
  commented: { courtId: 'CA  REIMS' },
  courtLabel: "Cour d'appel de Reims",
  id: 'CA  REIMS',
  installationDate: null,
  magistrat: null,
};

const POSITIONS = { HELD: EDITED, VACANT };
const ANSWERS = ['FOUND', 'NOT_FOUND', 'FAILED'] as const;

const COURT_COMMENT_PATH = '*/api/veille-des-postes/v1/juridictions/:courtId/commentaire';
const VACANCY_PATH = '*/api/veille-des-postes/v1/titulaires/:magistratId/vacance';

/** an answer other than found replaces the one of the story: undefined lets the story answer */
function answerOf(answer: (typeof ANSWERS)[number]) {
  if (answer === 'NOT_FOUND') return new HttpResponse(null, { status: 404 });
  if (answer === 'FAILED') return new HttpResponse(null, { status: 500 });
  return undefined;
}

function PositionVacancySidePanelStory(props: {
  answer: (typeof ANSWERS)[number];
  position: keyof typeof POSITIONS;
}) {
  const [isLeaveBlocked, setLeaveBlocked] = useState(false);

  return (
    <StoryQueryClient key={`${props.position} ${props.answer}`}>
      <ToastProvider>
        <ConfirmModalProvider>
          <PositionVacancySidePanel
            edited={POSITIONS[props.position]}
            isLeaveBlocked={isLeaveBlocked}
            onClose={() => {}}
            onLeaveBlockedChange={setLeaveBlocked}
            onNext={undefined}
            onPrevious={undefined}
          />
        </ConfirmModalProvider>
      </ToastProvider>
    </StoryQueryClient>
  );
}

const meta = {
  argTypes: {
    answer: { control: 'inline-radio', options: ANSWERS },
    position: { control: 'inline-radio', options: Object.keys(POSITIONS) },
  },
  args: { answer: 'FOUND', position: 'HELD' },
  beforeEach: ({ args, msw }) => {
    msw.use(
      http.get(VACANCY_PATH, () => answerOf(args.answer)),
      http.get(COURT_COMMENT_PATH, () => answerOf(args.answer)),
      ...positionVacancyHandlers([
        EDITED,
        {
          ...VACANT,
          commentPreview: 'Intérim assuré par le président de chambre le plus ancien',
          court: { id: 'CA  REIMS' },
        },
      ]),
    );
  },
  component: PositionVacancySidePanelStory,
  parameters: {
    docs: {
      description: {
        component:
          "Le panneau ouvert par le stylo de la colonne \"Alerte / statut\". Le motif, la date et les justificatifs s'enregistrent à chaque changement dès que le motif et la date sont connus. La story garde ce qui est déclaré tant qu'elle tourne. Le statut affiché reste celui de la ligne puisque c'est l'API qui le calcule. Une juridiction vacante s'ouvre par \"Commenter le poste\" et ne propose que le commentaire. Une réponse 404 dit que le magistrat a quitté le poste ou que la juridiction n'est plus suivie. Une autre erreur propose de réessayer.",
      },
    },
    layout: 'fullscreen',
  },
  title: 'Session/CSM/VeilleDesPostes/PositionVacancySidePanel',
} satisfies Meta<typeof PositionVacancySidePanelStory>;

export default meta;

export const Playground: StoryObj<typeof meta> = {};
