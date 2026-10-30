import type { Meta, StoryObj } from '@storybook/react-vite';
import { generatePath } from 'react-router';

import { PageStory } from '@/shared/storybook/PageStory';
import { seedStorySession, STORY_SESSION_ID } from '@/shared/storybook/story-session';
import { STORY_USERS, STORY_VIEWS, type StoryView } from '@/shared/storybook/story-users';
import {
  makeSummary,
  SUMMARY_ATTACHMENTS,
  SUMMARY_NOMINATION_FILE_ID,
  summaryObservationsHandlers,
} from '@/shared/storybook/summary.fixtures';
import { ROUTE_PATHS } from '@/utils/route-path.utils';
import { summaryKeys } from '@queries/summary.queries';

import { SummaryPage } from './SummaryPage';

const SUMMARY = makeSummary({
  auditionDate: { day: 15, month: 10, year: 2026 },
  auditionTime: { hours: 14, minutes: 30, seconds: 0 },
  observers: ['Syndicat de la magistrature'],
  priorities: ['ETOILE'],
  summary: {
    attachments: SUMMARY_ATTACHMENTS,
    readers: [{ firstName: 'Jean', id: STORY_USERS.member.id, lastName: 'Petit' }],
  },
});

function SummaryPageStory(props: { view: StoryView }) {
  return (
    <PageStory
      location={generatePath(ROUTE_PATHS.SUMMARY, {
        fileId: SUMMARY_NOMINATION_FILE_ID,
        sessionId: STORY_SESSION_ID,
      })}
      path={ROUTE_PATHS.SUMMARY}
      seed={(client) => {
        seedStorySession(client);
        client.setQueryData(
          summaryKeys.detailsSummary({
            nominationFileId: SUMMARY_NOMINATION_FILE_ID,
            sessionId: STORY_SESSION_ID,
          }),
          { ...SUMMARY, summary: { ...SUMMARY.summary, canWrite: props.view === 'sg' } },
        );
      }}
      view={props.view}
    >
      <SummaryPage />
    </PageStory>
  );
}

const meta = {
  args: { view: 'sg' },
  argTypes: { view: { control: 'inline-radio', options: STORY_VIEWS } },
  beforeEach: ({ msw }) => {
    msw.use(...summaryObservationsHandlers);
  },
  component: SummaryPageStory,
  parameters: { layout: 'fullscreen' },
  title: 'Pages/Details/Summary',
} satisfies Meta<typeof SummaryPageStory>;

export default meta;

export const Playground: StoryObj<typeof meta> = {};
