import type { Meta, StoryObj } from '@storybook/react-vite';

import { agendaBlocks, type BlocksState } from '@/features/documents/components/document-blocks.fixtures';
import { STORY_USERS } from '@/shared/storybook/story-users';
import { StoryQueryClient } from '@/shared/storybook/StoryQueryClient';
import { ToastProvider } from '@/shared/ui/toast';
import { authKeys } from '@queries/auth.queries';

import { AgendaDocumentEditor } from './AgendaDocumentEditor';

// the editor reads its blocks once: the key starts it again when a control changes them
function AgendaDocumentEditorStory(props: BlocksState) {
  return (
    <StoryQueryClient seed={(client) => client.setQueryData(authKeys.introspectSession(), STORY_USERS.sg)}>
      <ToastProvider>
        <div className="fr-py-6v mx-auto w-full max-w-7xl">
          <AgendaDocumentEditor
            agendaId="agenda-1"
            blocks={agendaBlocks(props)}
            key={`${props.outdated}-${props.rewritten}`}
            sessionId="session-1"
          />
        </div>
      </ToastProvider>
    </StoryQueryClient>
  );
}

const meta = {
  args: { outdated: false, rewritten: true },
  component: AgendaDocumentEditorStory,
  parameters: { layout: 'fullscreen' },
  title: 'Features/DocumentEditor/Agenda',
} satisfies Meta<typeof AgendaDocumentEditorStory>;

export default meta;

export const Playground: StoryObj<typeof meta> = {};
