import type { Meta, StoryObj } from '@storybook/react-vite';
import clsx from 'clsx';

import { DetailsLink } from '@/shared/components/details-link';
import { LolfiLink } from '@/shared/components/lolfi-link';

import { TitleNameIcons } from './TitleNameIcons';

const NAMES = ['DUPONT DE LA BOISSIÈRE Anne-Charlotte', 'SKŁODOWSKA Marie (ép. CURIE)'];

function TitleNameIconsStory(props: {
  hasDetectedMagistrat: boolean;
  name: string;
  small: boolean;
  titleColor: 'black' | 'blue';
}) {
  return (
    <h2 className={clsx('fr-h3 fr-mb-0', props.titleColor === 'blue' && 'text-(--text-title-blue-france)')}>
      <TitleNameIcons name={props.name}>
        <DetailsLink
          context="membre"
          magistratId={props.hasDetectedMagistrat ? 'magistrat-1' : null}
          small={props.small}
        />
        <LolfiLink name={props.name} nominationFileId="file-1" sessionId="session-1" small={props.small} />
      </TitleNameIcons>
    </h2>
  );
}

const meta = {
  title: 'Shared/TitleNameIcons',
  component: TitleNameIconsStory,
  parameters: { layout: 'padded' },
  tags: ['autodocs'],
  argTypes: {
    name: { control: 'select', options: NAMES },
    titleColor: { control: 'inline-radio', options: ['black', 'blue'] },
  },
  args: {
    hasDetectedMagistrat: true,
    name: NAMES[0],
    small: false,
    titleColor: 'black',
  },
} satisfies Meta<typeof TitleNameIconsStory>;

export default meta;

export const Playground: StoryObj<typeof meta> = {};
