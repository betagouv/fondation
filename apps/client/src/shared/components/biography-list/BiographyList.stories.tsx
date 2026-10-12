import type { Meta, StoryObj } from '@storybook/react-vite';

import { BiographyList } from './BiographyList';

const meta = {
  title: 'Shared/BiographyList',
  component: BiographyList,
  parameters: { layout: 'padded' },
  tags: ['autodocs'],
  argTypes: {
    biography: { control: 'text' },
  },
  args: {
    biography:
      "- Juge au TJ de LYON depuis le 01/09/2018 - Vice-président chargé de l'instruction au TJ de GRENOBLE du 01/09/2014 au 31/08/2018 - Auditeur de justice, promotion 2011",
  },
} satisfies Meta<typeof BiographyList>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Playground: Story = {};
