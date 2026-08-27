import type { Meta, StoryObj } from '@storybook/react-vite';

import { NominationFilesTableContext } from '@/features/nomination-files-table/context/files-table.context';
import { ConfirmModalProvider } from '@/shared/context/confirm-modal';
import { StoryQueryClient } from '@/shared/storybook/StoryQueryClient';
import { makeSessionNominationFile } from '@/test-utils/factories/session-nomination-file.factory';
import { makeSessionOutcomes } from '@/test-utils/factories/session-outcomes.factory';

import { AuditionDate } from './AuditionDate';

const SESSION_ID = 'session-1';

const SG_ROUTE = { initialEntries: [`/secretariat-general/session/${SESSION_ID}`] };

const PAST_AT = new Date('2020-01-10T14:30').getTime();

const VIEWS = ['sg', 'member'] as const;
type View = (typeof VIEWS)[number];

function AuditionDateStory(props: { auditionDateTime: number | null; view: View }) {
  const at = props.auditionDateTime ? new Date(props.auditionDateTime) : null;
  const editable = props.view === 'sg';

  const nominationFile = makeSessionNominationFile({
    auditionDate: at ? { year: at.getFullYear(), month: at.getMonth() + 1, day: at.getDate() } : null,
    auditionTime: at ? { hours: at.getHours(), minutes: at.getMinutes(), seconds: 0 } : null,
  });

  return (
    <StoryQueryClient>
      <ConfirmModalProvider>
        <NominationFilesTableContext
          value={{
            canManage: true,
            formation: 'SIEGE',
            outcomes: makeSessionOutcomes('SIEGE'),
            sessionId: SESSION_ID,
          }}
        >
          <AuditionDate
            editable={editable}
            key={`${props.view}-${props.auditionDateTime}`}
            nominationFile={nominationFile}
          />
        </NominationFilesTableContext>
      </ConfirmModalProvider>
    </StoryQueryClient>
  );
}

const meta = {
  title: 'Features/SidePanel/AuditionDate',
  component: AuditionDateStory,
  parameters: { layout: 'padded', router: SG_ROUTE },
  tags: ['autodocs'],
  argTypes: {
    auditionDateTime: { control: 'date' },
    view: { control: 'inline-radio', options: VIEWS },
  },
  args: { auditionDateTime: null, view: 'sg' },
} satisfies Meta<typeof AuditionDateStory>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

export const PastLocked: Story = {
  args: { auditionDateTime: PAST_AT },
};
