import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';

import { FormationEnum } from '@/shared/enums/formation.enum';
import { sgAuthHandlers } from '@/shared/storybook/msw.handlers';
import { sessionFiles, sessionMembers } from '@/shared/storybook/session-files.fixtures';
import { makeSessionHandlers, type SessionDataset } from '@/shared/storybook/session.handlers';
import { StoryQueryClient } from '@/shared/storybook/StoryQueryClient';
import { ToastProvider } from '@/shared/ui/toast';
import { makeSessionOutcomes } from '@/test-utils/factories/session-outcomes.factory';

import { AgendaFilesSelectionTable } from './AgendaFilesSelectionTable';

const reportedFileIds = sessionFiles
  .filter(({ content }) => content.status.value === 'DSJ_REPORTED')
  .map(({ id }) => id);

const sessions: Record<string, SessionDataset> = {
  draft: {
    agendaEligibleFileIds: sessionFiles.filter(({ id }) => !reportedFileIds.includes(id)).map(({ id }) => id),
    files: sessionFiles,
    members: sessionMembers,
  },
  'eligibility-unavailable': {
    files: sessionFiles,
    isAgendaEligibilityUnavailable: true,
    members: sessionMembers,
  },
  'every-ineligibility': {
    agendaIneligibleFiles: [
      { id: 'dossier-2', reason: 'REPORTED' },
      { id: 'dossier-3', reason: 'DRAFT_REPORTED' },
      { id: 'dossier-4', reason: 'UNIDENTIFIED' },
    ],
    files: sessionFiles,
    members: sessionMembers,
  },
};

function AgendaFilesSelectionTableStory(props: {
  hasActionsSlot: boolean;
  formation: FormationEnum;
  sessionId: string;
}) {
  const [actionsSlot, setActionsSlot] = useState<HTMLDivElement | null>(null);

  return (
    <StoryQueryClient key={`${props.formation}-${props.sessionId}`}>
      <ToastProvider>
        <div className="fr-container fr-py-4v">
          {props.hasActionsSlot && <div className="fr-mb-8v flex justify-end" ref={setActionsSlot} />}

          <AgendaFilesSelectionTable
            actionsSlot={actionsSlot}
            cancelLabel="Retour"
            formation={props.formation}
            onCancel={() => {}}
            onSubmit={() => {}}
            outcomes={makeSessionOutcomes(props.formation)}
            renderSubmitLabel={(count) =>
              count === 0 ? 'En attente de sélection' : "Générer l'ordre du jour"
            }
            sessionId={props.sessionId}
          />
        </div>
      </ToastProvider>
    </StoryQueryClient>
  );
}

const meta = {
  title: 'Session/Transparence/AgendaFilesSelectionTable',
  component: AgendaFilesSelectionTableStory,
  beforeEach: ({ msw }) => {
    msw.use(...sgAuthHandlers, ...makeSessionHandlers(sessions));
  },
  parameters: {
    layout: 'fullscreen',
    router: { initialEntries: ['/secretariat-general/session/draft/ordre-du-jour'] },
  },
  tags: ['autodocs'],
  argTypes: {
    hasActionsSlot: { control: 'boolean' },
    formation: { control: 'inline-radio', options: Object.values(FormationEnum) },
    sessionId: { table: { disable: true } },
  },
  args: { hasActionsSlot: true, formation: FormationEnum.SIEGE, sessionId: 'draft' },
} satisfies Meta<typeof AgendaFilesSelectionTableStory>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

export const EveryIneligibility: Story = { args: { sessionId: 'every-ineligibility' } };

export const EligibilityUnavailable: Story = {
  args: { sessionId: 'eligibility-unavailable' },
  tags: ['!autodocs'],
};
