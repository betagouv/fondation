import type { Meta, StoryObj } from '@storybook/react-vite';
import { http, HttpResponse } from 'msw';
import { generatePath } from 'react-router';

import { officialReportBlocks } from '@/features/documents/components/document-blocks.fixtures';
import { officialReportDocument } from '@/features/documents/components/document.fixture';
import {
  DOCUMENT_LIFECYCLES,
  type DocumentLifecycleName,
} from '@/shared/storybook/document-lifecycles.fixtures';
import { PageStory } from '@/shared/storybook/PageStory';
import { seedStorySession, STORY_SESSION_ID } from '@/shared/storybook/story-session';
import { ROUTE_PATHS } from '@/utils/route-path.utils';
import type { DetailedOfficialReportDocumentDto, DetailedOfficialReportMetadataDto } from '@api/types';
import { officialReportKeys } from '@queries/agenda.queries';

import { OfficialReportEditPage } from './OfficialReportEditPage';
import { OfficialReportPreviewPage } from './OfficialReportPreviewPage';

const OFFICIAL_REPORT_ID = 'official-report-1';
const MODES = ['preview', 'edit'] as const;

// msw handlers are set once while the controls change: they read what the story renders
let storyBlocks: DetailedOfficialReportDocumentDto = { blocks: [] };
let storyMetadata: DetailedOfficialReportMetadataDto | null = null;

function OfficialReportPreviewPageStory(props: {
  changedSinceValidation: boolean;
  lifecycle: DocumentLifecycleName;
  mode: (typeof MODES)[number];
  outdated: boolean;
}) {
  const lifecycle = DOCUMENT_LIFECYCLES[props.lifecycle];
  const blocks = officialReportBlocks({ outdated: props.outdated, rewritten: true });
  const metadata: DetailedOfficialReportMetadataDto = {
    ...lifecycle,
    absentMembers: [],
    recordedMembers: [],
    agendaId: 'agenda-1',
    chairmanId: null,
    // the API only tells what the validated version did not follow
    changedSinceValidation:
      props.changedSinceValidation && lifecycle.hasValidatedVersion ? ['OUTCOME', 'REPORTERS'] : [],
    hasRenunciation: false,
    id: OFFICIAL_REPORT_ID,
    isManuallyEdited: blocks.some((block) => block.edited),
    justiceDepartmentContactId: null,
    outdated: props.outdated,
    outdatedPropositions: blocks.filter((block) => block.kind === 'file' && block.outdated).length,
    secretaryId: null,
    sessionMeetingDate: { day: 3, month: 3, year: 2026 },
    sessionMeetingEndingTime: { hours: 12, minutes: 0, seconds: 0 },
    sessionMeetingStartingTime: { hours: 9, minutes: 30, seconds: 0 },
  };
  storyBlocks = { blocks };
  storyMetadata = metadata;

  const path =
    props.mode === 'edit' ? ROUTE_PATHS.SG.OFFICIAL_REPORT_EDIT : ROUTE_PATHS.SG.OFFICIAL_REPORT_PREVIEW;

  return (
    <PageStory
      key={`${props.lifecycle}-${props.changedSinceValidation}-${props.mode}-${props.outdated}`}
      location={generatePath(path, { officialReportId: OFFICIAL_REPORT_ID, sessionId: STORY_SESSION_ID })}
      path={path}
      seed={(client) => {
        seedStorySession(client);
        client.setQueryData(officialReportKeys.html(OFFICIAL_REPORT_ID), officialReportDocument());
        client.setQueryData(officialReportKeys.details(OFFICIAL_REPORT_ID), metadata);
      }}
      view="sg"
    >
      {props.mode === 'edit' ? <OfficialReportEditPage /> : <OfficialReportPreviewPage />}
    </PageStory>
  );
}

const meta = {
  args: { changedSinceValidation: false, lifecycle: 'neverValidated', mode: 'preview', outdated: false },
  argTypes: {
    lifecycle: { control: 'inline-radio', options: Object.keys(DOCUMENT_LIFECYCLES) },
    mode: { control: 'inline-radio', options: MODES },
  },
  // the edit page waits for blocks fetched after it mounts: they cannot come from the seeded cache
  beforeEach: ({ msw }) => {
    msw.use(
      http.get('*/api/docs/v1/official-reports/:officialReportId', () => HttpResponse.json(storyMetadata)),
      http.get('*/api/docs/v1/official-reports/:officialReportId/blocks', () =>
        HttpResponse.json(storyBlocks),
      ),
      http.patch(
        '*/api/docs/v1/official-reports/:officialReportId/blocks/*',
        () => new HttpResponse(null, { status: 204 }),
      ),
      http.delete(
        '*/api/docs/v1/official-reports/:officialReportId/blocks/*',
        () => new HttpResponse(null, { status: 204 }),
      ),
    );
  },
  component: OfficialReportPreviewPageStory,
  parameters: { layout: 'fullscreen' },
  title: 'Pages/Documents/OfficialReport',
} satisfies Meta<typeof OfficialReportPreviewPageStory>;

export default meta;

export const Playground: StoryObj<typeof meta> = {};
