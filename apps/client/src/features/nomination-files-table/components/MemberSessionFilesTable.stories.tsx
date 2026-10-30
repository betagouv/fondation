import type { Meta, StoryObj } from '@storybook/react-vite';

import { ConfirmModalProvider } from '@/shared/context/confirm-modal';
import { FormationEnum } from '@/shared/enums/formation.enum';
import { authHandlers } from '@/shared/storybook/msw.handlers';
import { sessionFiles, sessionMemberReports } from '@/shared/storybook/session-files.fixtures';
import { makeSessionHandlers, type SessionDataset } from '@/shared/storybook/session.handlers';
import { StoryQueryClient } from '@/shared/storybook/StoryQueryClient';
import { ToastProvider } from '@/shared/ui/toast';
import { makeSessionOutcomes } from '@/test-utils/factories/session-outcomes.factory';

import { MemberSessionFilesTable } from './MemberSessionFilesTable';

const sessions: Record<string, SessionDataset> = {
  'with-reports': { files: sessionFiles, memberReports: sessionMemberReports },
  'without-report': { files: sessionFiles },
  empty: { files: [] },
};

function MemberSessionFilesTableStory(props: { formation: FormationEnum; sessionId: string }) {
  return (
    <StoryQueryClient key={`${props.formation}-${props.sessionId}`}>
      <ToastProvider>
        <ConfirmModalProvider>
          <div className="fr-container fr-py-4v">
            <MemberSessionFilesTable
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
  args: { formation: FormationEnum.SIEGE, sessionId: 'with-reports' },
  argTypes: {
    formation: { control: 'inline-radio', options: Object.values(FormationEnum) },
    sessionId: { control: 'inline-radio', options: Object.keys(sessions) },
  },
  beforeEach: ({ msw }) => {
    msw.use(...authHandlers, ...makeSessionHandlers(sessions));
  },
  component: MemberSessionFilesTableStory,
  parameters: {
    layout: 'fullscreen',
    router: {
      initialEntries: ['/transparences/pouvoir-de-proposition-du-garde-des-sceaux/sessions/with-reports'],
    },
  },
  title: 'Session/Transparence/MemberSessionFilesTable',
} satisfies Meta<typeof MemberSessionFilesTableStory>;

export default meta;

export const Playground: StoryObj<typeof meta> = {};
