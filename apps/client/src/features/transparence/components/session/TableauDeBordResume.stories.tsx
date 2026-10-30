import type { Meta, StoryObj } from '@storybook/react-vite';
import { http, HttpResponse } from 'msw';

import { ArchivedSessionContext } from '@/shared/context/archived-session';
import { ConfirmModalProvider } from '@/shared/context/confirm-modal';
import { FormationEnum } from '@/shared/enums/formation.enum';
import { sgAuthHandlers } from '@/shared/storybook/msw.handlers';
import { STORY_SESSION } from '@/shared/storybook/story-session';
import { StoryQueryClient } from '@/shared/storybook/StoryQueryClient';
import { ToastProvider } from '@/shared/ui/toast';
import type { DetailedNominationSessionDto } from '@api/types';

import { TableauDeBordResume } from './TableauDeBordResume';

const noContent = () => new HttpResponse(null, { status: 204 });

const sessionHandlers = [
  http.delete('*/api/sessions/v2/:sessionId', noContent),
  http.patch('*/api/sessions/v2/:sessionId', noContent),
  http.put('*/api/sessions/v2/:sessionId', noContent),
  http.post('*/api/sessions/v2/:sessionId/archive', noContent),
  http.post('*/api/sessions/v2/:sessionId/validation', noContent),
];

const SESSION: DetailedNominationSessionDto = {
  ...STORY_SESSION,
  dueDate: { day: 13, month: 3, year: 2026 },
  isValidated: false,
  positionStartDate: { day: 1, month: 9, year: 2026 },
};

// as the API decides them: deletable without any attachment nor affectation, archivable once validated
// and every file reported
const STATUSES = {
  newDraft: { isDeletable: true },
  assignedDraft: {},
  validated: { isValidated: true },
  archivable: { isArchivable: true, isValidated: true },
  archived: { isArchived: true, isValidated: true },
} satisfies Record<string, Partial<DetailedNominationSessionDto>>;
type Status = keyof typeof STATUSES;

function TableauDeBordResumeStory(props: { formation: FormationEnum; status: Status }) {
  const session = { ...SESSION, ...STATUSES[props.status], formation: props.formation };

  return (
    <StoryQueryClient>
      <ToastProvider>
        <ConfirmModalProvider>
          <ArchivedSessionContext value={{ isArchived: session.isArchived, setIsArchived: () => {} }}>
            <div className="fr-container fr-py-4v">
              <TableauDeBordResume {...session} />
            </div>
          </ArchivedSessionContext>
        </ConfirmModalProvider>
      </ToastProvider>
    </StoryQueryClient>
  );
}

const meta = {
  args: { formation: 'SIEGE', status: 'newDraft' },
  argTypes: {
    formation: { control: 'inline-radio', options: Object.values(FormationEnum) },
    status: { control: 'inline-radio', options: Object.keys(STATUSES) },
  },
  beforeEach: ({ msw }) => {
    msw.use(...sgAuthHandlers, ...sessionHandlers);
  },
  component: TableauDeBordResumeStory,
  parameters: { layout: 'fullscreen' },
  title: 'Session/Transparence/SessionHeader',
} satisfies Meta<typeof TableauDeBordResumeStory>;

export default meta;

export const Playground: StoryObj<typeof meta> = {};
