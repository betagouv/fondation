import type { Meta, StoryObj } from '@storybook/react-vite';

import { NominationFileOutcomeCommentModalProvider } from '../../../nomination-file-outcome/NominationFileOutcomeCommentModalProvider';
import { ObservationFollowUpReminderProvider } from '../../../observation-follow-up/ObservationFollowUpReminderProvider';
import { NominationFilesTableProvider } from '@/features/nomination-files-table/context/NominationFilesTableProvider';
import { StoryQueryClient } from '@/shared/storybook/StoryQueryClient';
import { makeSessionNominationFile } from '@/test-utils/factories/session-nomination-file.factory';
import { FormationEnum, NominationFileOutcomeEnum } from '@/types/enums.types';

import { MagistratOutcome } from './MagistratOutcome';

const SESSION_ID = 'session-1';

const outcomes = Object.values(NominationFileOutcomeEnum);

function MagistratOutcomeStory(props: {
  formation: FormationEnum;
  outcome: NominationFileOutcomeEnum | null;
  comment: string | null;
}) {
  const nominationFile = makeSessionNominationFile({
    content: { outcome: props.outcome ? { comment: props.comment, value: props.outcome } : null },
  });

  return (
    <StoryQueryClient>
      <NominationFilesTableProvider formation={props.formation} sessionId={SESSION_ID}>
        <NominationFileOutcomeCommentModalProvider formation={props.formation}>
          <ObservationFollowUpReminderProvider>
            <MagistratOutcome nominationFile={nominationFile} />
          </ObservationFollowUpReminderProvider>
        </NominationFileOutcomeCommentModalProvider>
      </NominationFilesTableProvider>
    </StoryQueryClient>
  );
}

const meta = {
  title: 'Features/Magistrat/MagistratOutcome',
  component: MagistratOutcomeStory,
  parameters: { layout: 'padded' },
  tags: ['autodocs'],
  argTypes: {
    formation: { control: 'inline-radio', options: Object.values(FormationEnum) },
    outcome: { control: 'select', options: [null, ...outcomes] },
    comment: { control: 'text' },
  },
  args: {
    formation: FormationEnum.SIEGE,
    outcome: NominationFileOutcomeEnum.VALIDATED,
    comment: 'Profil conforme aux attentes de la formation.',
  },
} satisfies Meta<typeof MagistratOutcomeStory>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Conforme: Story = {};

export const WithoutComment: Story = {
  args: { outcome: NominationFileOutcomeEnum.NON_VALIDATED, comment: null },
};

export const NotDefined: Story = { args: { outcome: null, comment: null } };
