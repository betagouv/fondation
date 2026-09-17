import type { Meta, StoryObj } from '@storybook/react-vite';
import { http, HttpResponse } from 'msw';

import { ArchivedSessionContext } from '@/shared/context/archived-session';
import { ConfirmModalProvider } from '@/shared/context/confirm-modal';
import { FormationEnum } from '@/shared/enums/formation.enum';
import { sgAuthHandlers } from '@/shared/storybook/msw.handlers';
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

const NEW_SESSION: DetailedNominationSessionDto = {
  date: { year: 2026, month: 2, day: 20 },
  dueDate: null,
  formation: 'SIEGE',
  id: 'session-1',
  isArchivable: false,
  isArchived: false,
  isDeletable: true,
  isValidated: false,
  name: 'Transparence annuelle',
  observationsClosingDate: { year: 2026, month: 2, day: 27 },
  outcomes: [],
  positionStartDate: null,
  typeDeSaisine: 'TRANSPARENCE_GDS',
};

function TableauDeBordResumeStory(props: DetailedNominationSessionDto & { dense?: boolean }) {
  return (
    <StoryQueryClient>
      <ToastProvider>
        <ConfirmModalProvider>
          <ArchivedSessionContext value={{ isArchived: props.isArchived, setIsArchived: () => {} }}>
            <div className="fr-container fr-py-4v">
              <TableauDeBordResume {...props} />
            </div>
          </ArchivedSessionContext>
        </ConfirmModalProvider>
      </ToastProvider>
    </StoryQueryClient>
  );
}

const meta = {
  title: 'Session/Transparence/TableauDeBordResume',
  component: TableauDeBordResumeStory,
  beforeEach: ({ msw }) => {
    msw.use(...sgAuthHandlers, ...sessionHandlers);
  },
  parameters: {
    controls: {
      include: ['dense', 'formation', 'isArchivable', 'isArchived', 'isDeletable', 'isValidated', 'name'],
    },
    layout: 'fullscreen',
  },
  tags: ['autodocs'],
  argTypes: {
    formation: { control: 'radio', options: Object.values(FormationEnum) },
  },
  args: NEW_SESSION,
} satisfies Meta<typeof TableauDeBordResumeStory>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Playground: Story = {};
