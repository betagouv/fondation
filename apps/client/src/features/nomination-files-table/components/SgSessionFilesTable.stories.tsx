import type { Meta, StoryObj } from '@storybook/react-vite';

import { AlertsProvider } from '@/shared/context/alerts';
import { ConfirmationProvider } from '@/shared/context/confirmation';
import { sgAuthHandlers } from '@/shared/storybook/msw.handlers';
import { sessionFiles, sessionMembers } from '@/shared/storybook/session-files.fixtures';
import { makeSessionHandlers, type SessionDataset } from '@/shared/storybook/session.handlers';
import { StoryQueryClient } from '@/shared/storybook/StoryQueryClient';
import { makeSessionOutcomes } from '@/test-utils/factories/session-outcomes.factory';
import { FormationEnum } from '@/types/enums.types';

import { SgSessionFilesTable } from './SgSessionFilesTable';

const sessions: Record<string, SessionDataset> = {
  draft: { files: sessionFiles, members: sessionMembers },
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

function SgSessionFilesTableStory(props: {
  canManage: boolean;
  formation: FormationEnum;
  sessionId: string;
}) {
  return (
    <StoryQueryClient key={`${props.canManage}-${props.formation}-${props.sessionId}`}>
      <AlertsProvider>
        <ConfirmationProvider>
          <div className="fr-container fr-py-4v">
            <SgSessionFilesTable
              canManage={props.canManage}
              formation={props.formation}
              outcomes={makeSessionOutcomes(props.formation)}
              sessionId={props.sessionId}
            />
          </div>
        </ConfirmationProvider>
      </AlertsProvider>
    </StoryQueryClient>
  );
}

const meta = {
  title: 'Features/Session/SgSessionFilesTable',
  component: SgSessionFilesTableStory,
  beforeEach: ({ msw }) => {
    msw.use(...sgAuthHandlers, ...makeSessionHandlers(sessions));
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

export const Default: Story = {};

export const PublishedAffectations: Story = {
  args: { sessionId: 'published' },
};

export const Archived: Story = {
  args: { canManage: false },
};

export const Empty: Story = {
  args: { sessionId: 'empty' },
};
