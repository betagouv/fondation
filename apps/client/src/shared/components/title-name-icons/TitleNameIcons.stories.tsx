import type { Meta, StoryObj } from '@storybook/react-vite';
import clsx from 'clsx';

import { TitleNameIcons } from './TitleNameIcons';

const meta = {
  title: 'Shared/TitleNameIcons',
  component: TitleNameIcons,
  parameters: { layout: 'padded' },
  tags: ['autodocs'],
  argTypes: {
    detailsLink: { table: { disable: true } },
    lolfi: { table: { disable: true } },
  },
} satisfies Meta<typeof TitleNameIcons>;

export default meta;

type PlaygroundArgs = {
  hasDetectedMagistrat: boolean;
  name: string;
  small: boolean;
  titleColor: 'black' | 'blue';
};

export const Playground: StoryObj<PlaygroundArgs> = {
  args: {
    hasDetectedMagistrat: true,
    name: 'DUPONT DE LA BOISSIÈRE Anne-Charlotte',
    small: false,
    titleColor: 'black',
  },
  argTypes: {
    hasDetectedMagistrat: { control: 'boolean' },
    name: { control: 'text' },
    small: { control: 'boolean' },
    titleColor: { control: 'inline-radio', options: ['black', 'blue'] },
  },
  render: (args) => (
    <h2 className={clsx('fr-h3 fr-mb-0', args.titleColor === 'blue' && 'text-(--text-title-blue-france)')}>
      <TitleNameIcons
        detailsLink={{
          context: 'membre',
          magistratId: args.hasDetectedMagistrat ? 'magistrat-1' : null,
        }}
        lolfi={{ sessionId: 'session-1', nominationFileId: 'file-1' }}
        name={args.name}
        small={args.small}
      />
    </h2>
  ),
};

export const LolfiOnly: StoryObj = {
  render: () => (
    <h2 className="fr-h3 fr-mb-0">
      <TitleNameIcons
        lolfi={{ href: 'https://lolfi.example.fr/magistrat/1' }}
        name="Mme DUPONT Anne-Charlotte"
        small
      />
    </h2>
  ),
};
