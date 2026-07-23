import type { Meta, StoryObj } from '@storybook/react-vite';

import { DetailsLink } from './DetailsLink';

const meta = {
  title: 'Shared/DetailsLink',
  component: DetailsLink,
  parameters: { layout: 'padded' },
  tags: ['autodocs'],
  argTypes: {
    className: { table: { disable: true } },
    magistratId: { table: { disable: true } },
  },
} satisfies Meta<typeof DetailsLink>;

export default meta;

type PlaygroundArgs = {
  context: 'sg' | 'membre';
  hasDetectedMagistrat: boolean;
  small: boolean;
};

export const Playground: StoryObj<PlaygroundArgs> = {
  args: {
    context: 'sg',
    hasDetectedMagistrat: true,
    small: true,
  },
  argTypes: {
    context: { control: 'inline-radio', options: ['sg', 'membre'] },
    hasDetectedMagistrat: { control: 'boolean' },
    small: { control: 'boolean' },
  },
  render: (args) => (
    <DetailsLink
      context={args.context}
      magistratId={args.hasDetectedMagistrat ? 'magistrat-1' : null}
      small={args.small}
    />
  ),
};
