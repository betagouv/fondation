import type { Meta, StoryObj } from '@storybook/react-vite';

import { NominationFileOutcomeCommentModalProvider } from '../../../nomination-file-outcome/NominationFileOutcomeCommentModalProvider';
import { NominationFilesTableProvider } from '@/features/nomination-files-table/context/NominationFilesTableProvider';
import { StoryQueryClient } from '@/shared/storybook/StoryQueryClient';
import { makeSessionNominationFile } from '@/test-utils/factories/session-nomination-file.factory';
import { makeSessionOutcomes } from '@/test-utils/factories/session-outcomes.factory';
import { FormationEnum, NominationFileOutcomeEnum } from '@/types/enums.types';

import { MagistratOutcome } from './MagistratOutcome';

const SESSION_ID = 'session-1';

const outcomes = Object.values(NominationFileOutcomeEnum);

function MagistratOutcomeStory(props: {
  comment: string | null;
  formation: FormationEnum;
  outcome: NominationFileOutcomeEnum | null;
}) {
  const sessionOutcomes = makeSessionOutcomes(props.formation);
  const nominationFile = makeSessionNominationFile({
    content: { outcome: props.outcome ? { comment: props.comment, value: props.outcome } : null },
  });

  return (
    <StoryQueryClient>
      <NominationFilesTableProvider
        formation={props.formation}
        outcomes={sessionOutcomes}
        sessionId={SESSION_ID}
      >
        <NominationFileOutcomeCommentModalProvider>
          <MagistratOutcome nominationFile={nominationFile} />
        </NominationFileOutcomeCommentModalProvider>
      </NominationFilesTableProvider>
    </StoryQueryClient>
  );
}

const meta = {
  title: 'Features/Magistrat/MagistratOutcome',
  component: MagistratOutcomeStory,
  parameters: {
    layout: 'padded',
    router: { initialEntries: [`/secretariat-general/session/${SESSION_ID}`] },
  },
  tags: ['autodocs'],
  argTypes: {
    comment: { control: 'text' },
    formation: { control: 'inline-radio', options: Object.values(FormationEnum) },
    outcome: { control: 'select', options: [null, ...outcomes] },
  },
  args: {
    comment: 'Profil conforme aux attentes de la formation.',
    formation: FormationEnum.SIEGE,
    outcome: NominationFileOutcomeEnum.VALIDATED,
  },
} satisfies Meta<typeof MagistratOutcomeStory>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Conforme: Story = {};

export const WithoutComment: Story = {
  args: { comment: null, outcome: NominationFileOutcomeEnum.NON_VALIDATED },
};

export const NotDefined: Story = { args: { comment: null, outcome: null } };
