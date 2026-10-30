import type { Meta, StoryObj } from '@storybook/react-vite';

import { UserStatusBadge } from './UserStatusBadge';

const meta = {
  args: { status: 'ACTIVE' },
  argTypes: { status: { control: 'inline-radio', options: ['ACTIVE', 'DEACTIVATED'] } },
  component: UserStatusBadge,
  parameters: { layout: 'padded' },
  tags: ['autodocs'],
  title: 'Shared/UserStatusBadge',
} satisfies Meta<typeof UserStatusBadge>;

export default meta;

export const Playground: StoryObj<typeof meta> = {};
