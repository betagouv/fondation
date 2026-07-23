import type { Meta, StoryObj } from '@storybook/react-vite';

import { LolfiLink } from './LolfiLink';

const meta = {
  title: 'Shared/LolfiLink',
  component: LolfiLink,
  parameters: { layout: 'padded' },
  tags: ['autodocs'],
  argTypes: {
    className: { table: { disable: true } },
    href: { table: { disable: true } },
    name: { table: { disable: true } },
    nominationFileId: { table: { disable: true } },
    sessionId: { table: { disable: true } },
  },
} satisfies Meta<typeof LolfiLink>;

export default meta;

type PlaygroundArgs = {
  small: boolean;
  target: 'direct-url' | 'nomination-file-redirect';
};

export const Playground: StoryObj<PlaygroundArgs> = {
  args: {
    small: true,
    target: 'direct-url',
  },
  argTypes: {
    small: { control: 'boolean' },
    target: { control: 'inline-radio', options: ['direct-url', 'nomination-file-redirect'] },
  },
  render: (args) =>
    args.target === 'direct-url' ? (
      <LolfiLink href="https://lolfi.example.fr/magistrat/1" small={args.small} />
    ) : (
      <LolfiLink name="DUPONT Marie" nominationFileId="dossier-1" sessionId="session-1" small={args.small} />
    ),
};
