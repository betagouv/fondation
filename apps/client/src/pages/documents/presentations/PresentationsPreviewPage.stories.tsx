import type { Meta, StoryObj } from '@storybook/react-vite';
import { http, HttpResponse } from 'msw';
import { generatePath } from 'react-router';

import { presentationNoticeDocument } from '@/features/documents/components/document.fixture';
import { DOCUMENT_VALIDATION } from '@/shared/storybook/document-lifecycles.fixtures';
import { PageStory } from '@/shared/storybook/PageStory';
import { STORY_AUTHORS } from '@/shared/storybook/story-users';
import { ROUTE_PATHS } from '@/utils/route-path.utils';
import type { DetailedPresentationPlanMetadataDto } from '@api/types';
import { presentationPlanKeys } from '@queries/agenda.queries';

import { PresentationEditPage } from './PresentationEditPage';
import { PresentationPreviewPage } from './PresentationsPreviewPage';

const PLAN_ID = 'plan-1';
const MODES = ['preview', 'edit'] as const;

type Lifecycle = Pick<
  DetailedPresentationPlanMetadataDto,
  'draft' | 'isPresented' | 'presentation' | 'status' | 'validation'
>;

// a notice is validated once only: no draft over a validated version, unlike the agenda and the report
const LIFECYCLES = {
  draft: {
    draft: {
      openedAt: '2026-09-24T07:21:00.000Z',
      openedBy: STORY_AUTHORS.sg,
      systemCauses: [],
      systemUpdatedAt: null,
      updatedAt: '2026-09-24T09:12:00.000Z',
      updatedBy: STORY_AUTHORS.sg,
    },
    isPresented: false,
    presentation: null,
    status: 'DRAFT',
    validation: null,
  },
  validated: {
    draft: null,
    isPresented: false,
    presentation: null,
    status: 'VALIDATED',
    validation: DOCUMENT_VALIDATION,
  },
  presented: {
    draft: null,
    isPresented: true,
    presentation: {
      by: STORY_AUTHORS.sg,
      date: { day: 23, month: 9, year: 2026 },
      endTime: { hours: 12, minutes: 0, seconds: 0 },
    },
    status: 'VALIDATED',
    validation: DOCUMENT_VALIDATION,
  },
} satisfies Record<string, Lifecycle>;

const CHAIRMAN = { firstName: 'Paul', lastName: 'LEROY' };

const REMOVED_AGENDA: DetailedPresentationPlanMetadataDto['removedAgendas'][number] = {
  agenda: { chairman: CHAIRMAN, id: 'agenda-2', sessionMeetingDate: { day: 10, month: 3, year: 2026 } },
  removedAt: '2026-09-24T10:30:00.000Z',
  removedBy: STORY_AUTHORS.sg,
  takenBy: {
    chairman: CHAIRMAN,
    date: { day: 30, month: 9, year: 2026 },
    id: 'plan-2',
    time: { hours: 10, minutes: 0, seconds: 0 },
  },
};

// msw handlers are set once while the controls change: they read what the story renders
let storyMetadata: DetailedPresentationPlanMetadataDto | null = null;

function PresentationPreviewPageStory(props: {
  agendaRemoved: boolean;
  lifecycle: keyof typeof LIFECYCLES;
  manuallyEdited: boolean;
  mode: (typeof MODES)[number];
  outdated: boolean;
}) {
  const metadata: DetailedPresentationPlanMetadataDto = {
    ...LIFECYCLES[props.lifecycle],
    absentMemberIds: [],
    agendas: [{ comment: '', id: 'agenda-1' }],
    chairmanId: null,
    date: { day: 23, month: 9, year: 2026 },
    formation: 'SIEGE',
    hasRenunciation: false,
    id: PLAN_ID,
    isManuallyEdited: props.manuallyEdited,
    justiceDepartmentContactId: null,
    outdated: props.outdated,
    removedAgendas: props.agendaRemoved && props.lifecycle === 'draft' ? [REMOVED_AGENDA] : [],
    secretaryId: null,
    time: { hours: 10, minutes: 0, seconds: 0 },
  };
  storyMetadata = metadata;

  // the edit page sends a presented notice back to its preview
  const isEditing = props.mode === 'edit' && !metadata.isPresented;
  const path = isEditing ? ROUTE_PATHS.SG.PRESENTATIONS_EDIT : ROUTE_PATHS.SG.PRESENTATIONS_PREVIEW;

  return (
    <PageStory
      key={`${props.lifecycle}-${props.agendaRemoved}-${props.manuallyEdited}-${props.mode}-${props.outdated}`}
      location={generatePath(path, { planId: PLAN_ID })}
      path={path}
      seed={(client) => {
        client.setQueryData(presentationPlanKeys.planHtml({ id: PLAN_ID }), presentationNoticeDocument());
        client.setQueryData(presentationPlanKeys.planMetadata({ id: PLAN_ID }), metadata);
      }}
      view="sg"
    >
      {isEditing ? <PresentationEditPage /> : <PresentationPreviewPage />}
    </PageStory>
  );
}

const meta = {
  args: { agendaRemoved: false, lifecycle: 'draft', manuallyEdited: false, mode: 'preview', outdated: false },
  argTypes: {
    lifecycle: { control: 'inline-radio', options: Object.keys(LIFECYCLES) },
    mode: { control: 'inline-radio', options: MODES },
  },
  // a save or a return to the generated text reads the notice again
  beforeEach: ({ msw }) => {
    msw.use(
      http.get(`*/api/docs/v1/presentation-plans/${PLAN_ID}`, () => HttpResponse.json(storyMetadata)),
      http.get(`*/api/docs/v1/presentation-plans/${PLAN_ID}.html`, () =>
        HttpResponse.html(presentationNoticeDocument()),
      ),
      http.patch(
        `*/api/docs/v1/presentation-plans/${PLAN_ID}/html`,
        () => new HttpResponse(null, { status: 204 }),
      ),
      http.delete(
        `*/api/docs/v1/presentation-plans/${PLAN_ID}/document`,
        () => new HttpResponse(null, { status: 204 }),
      ),
    );
  },
  component: PresentationPreviewPageStory,
  parameters: { layout: 'fullscreen' },
  title: 'Pages/Documents/PresentationNotice',
} satisfies Meta<typeof PresentationPreviewPageStory>;

export default meta;

export const Playground: StoryObj<typeof meta> = {};
