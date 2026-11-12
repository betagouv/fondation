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

// a member recused from an unaffected file, which the bulk affectation skips
const RECUSALS = new Map([
  ['dossier-5', sessionMembers.map(({ firstName, id, lastName }) => ({ firstName, id, lastName }))],
]);

// as the API serves them to the Secrétariat général: recusals and reporters editable until the file is locked,
// never a reporter recused nor a recused member affected
const sgSessionFiles = sessionFiles.map((file) => {
  const canRecuseMembers = file.content.lockedReason === null;
  const recusedMembers = RECUSALS.get(file.id) ?? file.recusedMembers;
  return {
    ...file,
    canRecuseMembers,
    nonAffectableMembers: recusedMembers.map(({ id }) => ({ id, reason: 'RECUSED' as const })),
    nonRecusableMembers: canRecuseMembers
      ? file.reporters.map(({ id }) => ({ id, reason: 'REPORTER' as const }))
      : [],
    recusedMembers,
  };
});

const sessions: Record<string, SessionDataset> = {
  draft: {
    agendaEligibleFileIds: sessionFiles
      .filter(({ content }) => content.status.value !== 'DSJ_REPORTED')
      .map(({ id }) => id),
    files: sgSessionFiles,
    members: sessionMembers,
  },
  published: {
    affectationHistory: {
      lastPublished: {
        at: '2026-06-02T09:00:00.000Z',
        by: { id: 'user-sg', name: 'Claire Mercier' },
        version: 2,
      },
      pending: null,
      status: 'PUBLISHED',
    },
    files: sgSessionFiles,
    members: sessionMembers,
  },
  empty: { files: [] },
};

const bulkActionHandlers = [
  http.post('*/api/sessions/v2/:sessionId/files/reporters', () => new HttpResponse(null, { status: 204 })),
  http.put('*/api/sessions/v2/:sessionId/files/outcome', () => new HttpResponse(null, { status: 204 })),
  http.put('*/api/sessions/v2/:sessionId/files/priorities', () => new HttpResponse(null, { status: 204 })),
  http.put(
    '*/api/sessions/v2/:sessionId/files/recused-members',
    () => new HttpResponse(null, { status: 204 }),
  ),
];

function SgSessionFilesTableStory(props: {
  canManage: boolean;
  formation: FormationEnum;
  sessionId: string;
}) {
  const [filtersSlot, setFiltersSlot] = useState<HTMLDivElement | null>(null);
  const [headerSlot, setHeaderSlot] = useState<HTMLDivElement | null>(null);
  const [toolbarSlot, setToolbarSlot] = useState<HTMLDivElement | null>(null);

  return (
    <StoryQueryClient key={`${props.canManage}-${props.formation}-${props.sessionId}`}>
      <ToastProvider>
        <ConfirmModalProvider>
          <div className="fr-container fr-py-4v">
            <div className="fr-mb-4v" ref={setHeaderSlot} />
            <div className="fr-mb-4v min-h-10" ref={setFiltersSlot} />
            <div className="fr-mb-4v min-h-10" ref={setToolbarSlot} />

            <SgSessionFilesTable
              canManage={props.canManage}
              filtersSlot={filtersSlot}
              formation={props.formation}
              headerSlot={headerSlot}
              outcomes={makeSessionOutcomes(props.formation)}
              sessionId={props.sessionId}
              toolbarSlot={toolbarSlot}
            />
          </div>
        </ConfirmModalProvider>
      </ToastProvider>
    </StoryQueryClient>
  );
}

const meta = {
  args: { canManage: true, formation: FormationEnum.SIEGE, sessionId: 'draft' },
  argTypes: {
    formation: { control: 'inline-radio', options: Object.values(FormationEnum) },
    sessionId: { control: 'inline-radio', options: Object.keys(sessions) },
  },
  beforeEach: ({ msw }) => {
    msw.use(...bulkActionHandlers, ...sgAuthHandlers, ...makeSessionHandlers(sessions));
  },
  component: SgSessionFilesTableStory,
  parameters: {
    layout: 'fullscreen',
    router: { initialEntries: ['/secretariat-general/session/draft'] },
  },
  title: 'Session/Transparence/SgSessionFilesTable',
} satisfies Meta<typeof SgSessionFilesTableStory>;

export default meta;

export const Playground: StoryObj<typeof meta> = {};
