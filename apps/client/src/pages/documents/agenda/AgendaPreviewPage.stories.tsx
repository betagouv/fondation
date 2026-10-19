import type { Meta, StoryObj } from '@storybook/react-vite';
import { http, HttpResponse } from 'msw';
import { generatePath } from 'react-router';

import { agendaBlocks } from '@/features/documents/components/document-blocks.fixtures';
import { agendaDocument } from '@/features/documents/components/document.fixture';
import {
  DOCUMENT_LIFECYCLES,
  type DocumentLifecycleName,
} from '@/shared/storybook/document-lifecycles.fixtures';
import { PageStory } from '@/shared/storybook/PageStory';
import { seedStorySession, STORY_SESSION_ID } from '@/shared/storybook/story-session';
import { ROUTE_PATHS } from '@/utils/route-path.utils';
import type { DetailedAgendaDocumentBlocksDto, DetailedAgendaMetadata } from '@api/types';
import { agendaKeys } from '@queries/agenda.queries';

import { AgendaEditPage } from './AgendaEditPage';
import { AgendaPreviewPage } from './AgendaPreviewPage';

const AGENDA_ID = 'agenda-1';
const MODES = ['preview', 'edit'] as const;

// msw handlers are set once while the controls change: they read what the story renders
let storyBlocks: DetailedAgendaDocumentBlocksDto = { blocks: [] };
let storyMetadata: DetailedAgendaMetadata | null = null;

function AgendaPreviewPageStory(props: {
  lifecycle: DocumentLifecycleName;
  mode: (typeof MODES)[number];
  outdated: boolean;
}) {
  const blocks = agendaBlocks({ outdated: props.outdated, rewritten: true });
  const metadata: DetailedAgendaMetadata = {
    ...DOCUMENT_LIFECYCLES[props.lifecycle],
    chairmanId: null,
    date: { day: 3, month: 3, year: 2026 },
    id: AGENDA_ID,
    isManuallyEdited: blocks.some((block) => block.edited),
    outdated: props.outdated,
    outdatedPropositions: blocks.filter((block) => block.outdated).length,
    sessionMeetingDate: { day: 3, month: 3, year: 2026 },
  };
  storyBlocks = { blocks };
  storyMetadata = metadata;

  const path = props.mode === 'edit' ? ROUTE_PATHS.SG.AGENDA_EDIT : ROUTE_PATHS.SG.AGENDA_PREVIEW;

  return (
    <PageStory
      key={`${props.lifecycle}-${props.mode}-${props.outdated}`}
      location={generatePath(path, { agendaId: AGENDA_ID, sessionId: STORY_SESSION_ID })}
      path={path}
      seed={(client) => {
        seedStorySession(client);
        client.setQueryData(agendaKeys.agendaHtml(AGENDA_ID), agendaDocument());
        client.setQueryData(agendaKeys.detailsAgendaMetadata({ agendaId: AGENDA_ID }), metadata);
      }}
      view="sg"
    >
      {props.mode === 'edit' ? <AgendaEditPage /> : <AgendaPreviewPage />}
    </PageStory>
  );
}

const meta = {
  args: { lifecycle: 'neverValidated', mode: 'preview', outdated: false },
  argTypes: {
    lifecycle: { control: 'inline-radio', options: Object.keys(DOCUMENT_LIFECYCLES) },
    mode: { control: 'inline-radio', options: MODES },
  },
  // the edit page waits for blocks fetched after it mounts: they cannot come from the seeded cache
  beforeEach: ({ msw }) => {
    msw.use(
      http.get('*/api/docs/v1/agendas/:agendaId', () => HttpResponse.json(storyMetadata)),
      http.get('*/api/docs/v1/agendas/:agendaId/blocks', () => HttpResponse.json(storyBlocks)),
      http.patch(
        '*/api/docs/v1/agendas/:agendaId/blocks/files/:fileId',
        () => new HttpResponse(null, { status: 204 }),
      ),
      http.delete(
        '*/api/docs/v1/agendas/:agendaId/blocks/files/:fileId',
        () => new HttpResponse(null, { status: 204 }),
      ),
      http.put('*/api/docs/v1/agendas/:agendaId/files', () => new HttpResponse(null, { status: 204 })),
    );
  },
  component: AgendaPreviewPageStory,
  parameters: { layout: 'fullscreen' },
  title: 'Pages/Documents/Agenda',
} satisfies Meta<typeof AgendaPreviewPageStory>;

export default meta;

export const Playground: StoryObj<typeof meta> = {};
