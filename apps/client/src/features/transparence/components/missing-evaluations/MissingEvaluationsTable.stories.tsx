import type { Meta, StoryObj } from '@storybook/react-vite';
import { http, HttpResponse } from 'msw';

import { ConfirmModalProvider } from '@/shared/context/confirm-modal';
import { FormationEnum } from '@/shared/enums/formation.enum';
import { sgAuthHandlers } from '@/shared/storybook/msw.handlers';
import { sessionFiles, sessionMembers } from '@/shared/storybook/session-files.fixtures';
import { makeSessionHandlers, type SessionDataset } from '@/shared/storybook/session.handlers';
import { StoryQueryClient } from '@/shared/storybook/StoryQueryClient';
import { ToastProvider } from '@/shared/ui/toast';
import { makeSessionOutcomes } from '@/test-utils/factories/session-outcomes.factory';

import { MissingEvaluationsTable } from './MissingEvaluationsTable';

const sessions: Record<string, SessionDataset> = {
  empty: { files: sessionFiles.map((file) => ({ ...file, missingEvaluation: false })) },
  few: {
    files: sessionFiles.map((file, index) => ({
      ...file,
      missingEvaluation: index % 2 === 0,
      missingEvaluationComment: index === 0 ? 'Relance envoyée à la cour d’appel le 2 juin' : null,
    })),
    members: sessionMembers,
  },
};

const missingEvaluationHandlers = [
  http.patch(
    '*/api/sessions/v2/:sessionId/files/:nominationFileId/missing-evaluation',
    () => new HttpResponse(null, { status: 204 }),
  ),
  http.put(
    '*/api/sessions/v2/:sessionId/files/:nominationFileId/missing-evaluation/comment',
    () => new HttpResponse(null, { status: 204 }),
  ),
];

function MissingEvaluationsTableStory(props: { canManage: boolean; sessionId: string }) {
  return (
    <StoryQueryClient key={`${props.canManage}-${props.sessionId}`}>
      <ToastProvider>
        <ConfirmModalProvider>
          <MissingEvaluationsTable
            canManage={props.canManage}
            filtersSlot={null}
            formation={FormationEnum.SIEGE}
            outcomes={makeSessionOutcomes(FormationEnum.SIEGE)}
            sessionId={props.sessionId}
            toolbarSlot={null}
          />
        </ConfirmModalProvider>
      </ToastProvider>
    </StoryQueryClient>
  );
}

const meta = {
  args: { canManage: true, sessionId: 'few' },
  argTypes: { sessionId: { control: 'inline-radio', options: Object.keys(sessions) } },
  beforeEach: ({ msw }) => {
    msw.use(...missingEvaluationHandlers, ...sgAuthHandlers, ...makeSessionHandlers(sessions));
  },
  component: MissingEvaluationsTableStory,
  parameters: { layout: 'padded' },
  title: 'Session/GDS/MissingEvaluationsTable',
} satisfies Meta<typeof MissingEvaluationsTableStory>;

export default meta;

export const Playground: StoryObj<typeof meta> = {};
