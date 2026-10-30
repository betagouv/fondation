import Input from '@codegouvfr/react-dsfr/Input';
import type { Meta, StoryObj } from '@storybook/react-vite';

import { RequiredLabel } from './RequiredLabel';

const meta = {
  title: 'Shared/RequiredLabel',
  component: RequiredLabel,
  render: (args) => <Input label={<RequiredLabel {...args} />} nativeInputProps={{ required: true }} />,
  parameters: { layout: 'padded' },
  tags: ['autodocs'],
  argTypes: {
    children: { control: 'text' },
  },
  args: { children: 'Prénom' },
} satisfies Meta<typeof RequiredLabel>;

export default meta;

export const Playground: StoryObj<typeof meta> = {};
