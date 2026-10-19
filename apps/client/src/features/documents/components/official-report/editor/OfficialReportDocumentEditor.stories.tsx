import type { Meta, StoryObj } from '@storybook/react-vite';

import {
  officialReportBlocks,
  type BlocksState,
} from '@/features/documents/components/document-blocks.fixtures';
import { STORY_USERS } from '@/shared/storybook/story-users';
import { StoryQueryClient } from '@/shared/storybook/StoryQueryClient';
import { ToastProvider } from '@/shared/ui/toast';
import { authKeys } from '@queries/auth.queries';

import { OfficialReportDocumentEditor } from './OfficialReportDocumentEditor';

// the editor reads its blocks once: the key starts it again when a control changes them
function OfficialReportDocumentEditorStory(props: BlocksState) {
  return (
    <StoryQueryClient seed={(client) => client.setQueryData(authKeys.introspectSession(), STORY_USERS.sg)}>
      <ToastProvider>
        <div className="fr-py-6v mx-auto w-full max-w-7xl">
          <OfficialReportDocumentEditor
            blocks={officialReportBlocks(props)}
            key={`${props.outdated}-${props.rewritten}`}
            officialReportId="official-report-1"
            sessionId="session-1"
          />
        </div>
      </ToastProvider>
    </StoryQueryClient>
  );
}

const meta = {
  args: { outdated: false, rewritten: true },
  component: OfficialReportDocumentEditorStory,
  parameters: { layout: 'fullscreen' },
  title: 'Features/DocumentEditor/OfficialReport',
} satisfies Meta<typeof OfficialReportDocumentEditorStory>;

export default meta;

export const Playground: StoryObj<typeof meta> = {};
