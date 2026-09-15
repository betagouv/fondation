import type { Meta, StoryObj } from '@storybook/react-vite';
import { http, HttpResponse } from 'msw';
import { useState } from 'react';

import { ConfirmModalProvider } from '@/shared/context/confirm-modal';
import { FormationEnum } from '@/shared/enums/formation.enum';
import { sgAuthHandlers } from '@/shared/storybook/msw.handlers';
import { sessionFiles, sessionMembers } from '@/shared/storybook/session-files.fixtures';
import { makeSessionHandlers, type SessionDataset } from '@/shared/storybook/session.handlers';
import { StoryQueryClient } from '@/shared/storybook/StoryQueryClient';
import { ToastProvider } from '@/shared/ui/toast';
import { makeSessionOutcomes } from '@/test-utils/factories/session-outcomes.factory';

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

const bulkActionHandlers = [
  http.put('*/api/sessions/v2/:sessionId/files/reporters', () => new HttpResponse(null, { status: 204 })),
  http.put('*/api/sessions/v2/:sessionId/files/outcome', () => new HttpResponse(null, { status: 204 })),
];

function SgSessionFilesTableStory(props: {
  canManage: boolean;
  formation: FormationEnum;
  sessionId: string;
}) {
  const [headerSlot, setHeaderSlot] = useState<HTMLDivElement | null>(null);

  return (
    <StoryQueryClient key={`${props.canManage}-${props.formation}-${props.sessionId}`}>
      <ToastProvider>
        <ConfirmModalProvider>
          <div className="fr-container fr-py-4v">
            <div className="fr-mb-4v min-h-10" ref={setHeaderSlot} />

            <SgSessionFilesTable
              canManage={props.canManage}
              formation={props.formation}
              headerSlot={headerSlot}
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
    msw.use(...bulkActionHandlers, ...sgAuthHandlers, ...makeSessionHandlers(sessions));
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

export const Archived: Story = {
  args: { canManage: false },
};

export const Empty: Story = {
  args: { sessionId: 'empty' },
};
