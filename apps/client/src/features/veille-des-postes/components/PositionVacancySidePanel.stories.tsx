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

const COURT_COMMENT_PATH = '*/api/veille-des-postes/v1/juridictions/:courtId/commentaire';
const VACANCY_PATH = '*/api/veille-des-postes/v1/titulaires/:magistratId/vacance';

function PositionVacancySidePanelStory(props: { edited: EditedPosition }) {
  const [isLeaveBlocked, setLeaveBlocked] = useState(false);

  return (
    <StoryQueryClient>
      <ToastProvider>
        <ConfirmModalProvider>
          <PositionVacancySidePanel
            edited={props.edited}
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
  beforeEach: ({ msw }) => {
    msw.use(
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
  args: { edited: EDITED },
  component: PositionVacancySidePanelStory,
  parameters: {
    docs: {
      description: {
        component:
          "Le panneau ouvert par le stylo de la colonne \"Alerte / statut\". Le motif, la date et les justificatifs s'enregistrent à chaque changement dès que le motif et la date sont connus. La story garde ce qui est déclaré tant qu'elle tourne. Le statut affiché reste celui de la ligne puisque c'est l'API qui le calcule.",
      },
    },
    layout: 'fullscreen',
  },
  title: 'Session/CSM/PositionVacancySidePanel',
} satisfies Meta<typeof PositionVacancySidePanelStory>;

export default meta;

export const Playground: StoryObj<typeof meta> = {};

export const LoadFailed: StoryObj<typeof meta> = {
  beforeEach: ({ msw }) => {
    msw.use(http.get(VACANCY_PATH, () => new HttpResponse(null, { status: 500 })));
  },
  parameters: {
    docs: { description: { story: 'La lecture du statut échoue : le panneau propose de réessayer.' } },
  },
};

export const NoLongerHeld: StoryObj<typeof meta> = {
  beforeEach: ({ msw }) => {
    msw.use(http.get(VACANCY_PATH, () => new HttpResponse(null, { status: 404 })));
  },
  parameters: {
    docs: {
      description: {
        story: 'LOLFI a déplacé le magistrat depuis le chargement du tableau : la lecture répond 404.',
      },
    },
  },
};

export const VacantCourt: StoryObj<typeof meta> = {
  args: { edited: VACANT },
  parameters: {
    docs: {
      description: {
        story:
          "Une juridiction sans titulaire : le panneau s'ouvre par le stylo \"Commenter le poste\" et n'y propose que le commentaire, gardé d'un titulaire à l'autre.",
      },
    },
  },
};

export const VacantCourtNoLongerWatched: StoryObj<typeof meta> = {
  args: { edited: VACANT },
  beforeEach: ({ msw }) => {
    msw.use(http.get(COURT_COMMENT_PATH, () => new HttpResponse(null, { status: 404 })));
  },
  parameters: {
    docs: {
      description: {
        story: 'La juridiction a quitté la veille depuis le chargement du tableau : la lecture répond 404.',
      },
    },
  },
};
