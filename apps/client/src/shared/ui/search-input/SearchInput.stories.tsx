import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState, type ComponentProps } from 'react';

import { SearchInput } from './SearchInput';

function ControlledSearchInput(props: ComponentProps<typeof SearchInput>) {
  const [value, setValue] = useState(props.value);

  return (
    <SearchInput
      {...props}
      onChange={(next) => {
        setValue(next);
        props.onChange(next);
      }}
      onClear={() => {
        setValue('');
        props.onClear();
      }}
      value={value}
    />
  );
}

const meta = {
  title: 'Shared/SearchInput',
  component: SearchInput,
  parameters: { layout: 'padded' },
  tags: ['autodocs'],
  argTypes: {
    className: {
      control: 'inline-radio',
      options: ['w-56', 'w-72', 'w-96', 'w-full'],
    },
    onChange: { table: { disable: true } },
    onClear: { table: { disable: true } },
    value: { table: { disable: true } },
  },
  args: {
    className: 'w-72',
    onChange: () => {},
    onClear: () => {},
    placeholder: 'Rechercher',
    value: '',
  },
  render: (args) => <ControlledSearchInput {...args} />,
} satisfies Meta<typeof SearchInput>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Playground: Story = {};
