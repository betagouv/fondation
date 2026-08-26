import type { Meta, StoryObj } from '@storybook/react-vite';

import { ConfirmModalProvider } from '@/shared/context/confirm-modal';
import { sgAuthHandlers } from '@/shared/storybook/msw.handlers';
import { sessionFiles, sessionMembers } from '@/shared/storybook/session-files.fixtures';
import { makeSessionHandlers, type SessionDataset } from '@/shared/storybook/session.handlers';
import { StoryQueryClient } from '@/shared/storybook/StoryQueryClient';
import { ToastProvider } from '@/shared/ui/toast';
import { makeSessionOutcomes } from '@/test-utils/factories/session-outcomes.factory';
import { FormationEnum } from '@/types/enums.types';

import { SgSessionFilesTable } from './SgSessionFilesTable';

const sessions: Record<string, SessionDataset> = {
  draft: {
    agendaEligibleFileIds: sessionFiles
      .filter(({ content }) => content.status.value !== 'DSJ_REPORTED')
      .map(({ id }) => id),
    files: sessionFiles,
    members: sessionMembers,
  },
  published: {
    affectationsVersion: {
      '@type': 'fr.csm.fondation.affectations.version.some',
      author: { id: 'user-sg', firstName: 'Claire', lastName: 'Mercier' },
      id: 'affectations-version-2',
      publicationDate: '2026-06-02T09:00:00.000Z',
      status: 'PUBLIEE',
      version: 2,
    },
    files: sessionFiles,
    members: sessionMembers,
  },
  empty: { files: [] },
};

function prepareAgenda(fileIds: readonly string[], sessionId = 'draft') {
  localStorage.setItem(`fondation.agenda-basket.${sessionId}`, JSON.stringify({ fileIds }));
}

function SgSessionFilesTableStory(props: {
  canManage: boolean;
  formation: FormationEnum;
  sessionId: string;
}) {
  return (
    <StoryQueryClient key={`${props.canManage}-${props.formation}-${props.sessionId}`}>
      <ToastProvider>
        <ConfirmModalProvider>
          <div className="fr-container fr-py-4v">
            <SgSessionFilesTable
              canManage={props.canManage}
              formation={props.formation}
              outcomes={makeSessionOutcomes(props.formation)}
              sessionId={props.sessionId}
            />
          </div>
        </ConfirmModalProvider>
      </ToastProvider>
    </StoryQueryClient>
  );
}

const meta = {
  title: 'Session/Transparence/SgSessionFilesTable',
  component: SgSessionFilesTableStory,
  beforeEach: ({ msw }) => {
    msw.use(...sgAuthHandlers, ...makeSessionHandlers(sessions));
    prepareAgenda([]);
  },
  parameters: {
    layout: 'fullscreen',
    router: { initialEntries: ['/secretariat-general/session/draft'] },
  },
  tags: ['autodocs'],
  argTypes: {
    canManage: { control: 'boolean' },
    formation: { control: 'inline-radio', options: Object.values(FormationEnum) },
    sessionId: { control: 'inline-radio', options: Object.keys(sessions) },
  },
  args: { canManage: true, formation: FormationEnum.SIEGE, sessionId: 'draft' },
} satisfies Meta<typeof SgSessionFilesTableStory>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

export const PublishedAffectations: Story = {
  args: { sessionId: 'published' },
};

export const WithOdj: Story = {
  beforeEach: ({ msw }) => {
    msw.use(...sgAuthHandlers, ...makeSessionHandlers(sessions));
    prepareAgenda(['dossier-1', 'dossier-2', 'dossier-3']);
  },
};

export const Archived: Story = {
  args: { canManage: false },
};

export const Empty: Story = {
  args: { sessionId: 'empty' },
};
