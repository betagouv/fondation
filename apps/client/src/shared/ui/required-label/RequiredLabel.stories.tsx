import Input from '@codegouvfr/react-dsfr/Input';
import type { Meta, StoryObj } from '@storybook/react-vite';

import { RequiredLabel } from './RequiredLabel';

const meta = {
  title: 'Shared/RequiredLabel',
  component: RequiredLabel,
  parameters: { layout: 'padded' },
  tags: ['autodocs'],
  argTypes: {
    children: { control: 'text' },
  },
  args: { children: 'Prénom' },
} satisfies Meta<typeof RequiredLabel>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

export const WithinInputLabel: Story = {
  render: (args) => (
    <Input label={<RequiredLabel>{args.children}</RequiredLabel>} nativeInputProps={{ required: true }} />
  ),
};
