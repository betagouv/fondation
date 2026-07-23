import type { Meta, StoryObj } from '@storybook/react-vite';

import { NominationFilesTableContext } from '@/features/nomination-files-table/context/files-table.context';
import { ConfirmationProvider } from '@/shared/context/confirmation';
import { StoryQueryClient } from '@/shared/storybook/StoryQueryClient';
import { makeSessionNominationFile } from '@/test-utils/factories/session-nomination-file.factory';
import { makeSessionOutcomes } from '@/test-utils/factories/session-outcomes.factory';

import { AuditionDate } from './AuditionDate';

const SESSION_ID = 'session-1';

const SG_ROUTE = { initialEntries: [`/secretariat-general/session/${SESSION_ID}`] };

const UPCOMING_AT = new Date('2029-06-15T14:30').getTime();
const PAST_AT = new Date('2020-01-10T14:30').getTime();

function AuditionDateStory(props: { editable: boolean; auditionDateTime: number | null }) {
  const at = props.auditionDateTime ? new Date(props.auditionDateTime) : null;

  const nominationFile = makeSessionNominationFile({
    auditionDate: at ? { year: at.getFullYear(), month: at.getMonth() + 1, day: at.getDate() } : null,
    auditionTime: at ? { hours: at.getHours(), minutes: at.getMinutes(), seconds: 0 } : null,
  });

  return (
    <StoryQueryClient>
      <ConfirmationProvider>
        <NominationFilesTableContext
          value={{
            edition: undefined,
            formation: 'SIEGE',
            isEditable: true,
            outcomes: makeSessionOutcomes('SIEGE'),
            sessionId: SESSION_ID,
          }}
        >
          <AuditionDate
            editable={props.editable}
            key={`${props.editable}-${props.auditionDateTime}`}
            nominationFile={nominationFile}
          />
        </NominationFilesTableContext>
      </ConfirmationProvider>
    </StoryQueryClient>
  );
}

const meta = {
  title: 'Features/SidePanel/AuditionDate',
  component: AuditionDateStory,
  parameters: { layout: 'padded', router: SG_ROUTE },
  tags: ['autodocs'],
  argTypes: {
    editable: { control: 'boolean' },
    auditionDateTime: { control: 'date' },
  },
  args: { editable: true, auditionDateTime: null },
} satisfies Meta<typeof AuditionDateStory>;

export default meta;

type Story = StoryObj<typeof meta>;

export const EditableEmpty: Story = {};

export const EditableUpcoming: Story = {
  args: { auditionDateTime: UPCOMING_AT },
};

export const PastLocked: Story = {
  args: { auditionDateTime: PAST_AT },
};

export const ReadonlyMemberUpcoming: Story = {
  args: { auditionDateTime: UPCOMING_AT, editable: false },
};

export const ReadonlyMemberPast: Story = {
  args: { auditionDateTime: PAST_AT, editable: false },
};
