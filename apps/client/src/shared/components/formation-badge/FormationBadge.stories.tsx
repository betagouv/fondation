import type { Meta, StoryObj } from '@storybook/react-vite';

import { FormationEnum } from '@/shared/enums/formation.enum';

import { FormationBadge } from './FormationBadge';

const formations = Object.values(FormationEnum);

const meta = {
  title: 'Shared/FormationBadge',
  component: FormationBadge,
  parameters: { layout: 'padded' },
  tags: ['autodocs'],
  argTypes: {
    formation: { control: 'inline-radio', options: formations },
    small: { control: 'boolean' },
  },
  args: {
    formation: FormationEnum.SIEGE,
    small: false,
  },
} satisfies Meta<typeof FormationBadge>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

export const Formations: Story = {
  argTypes: { formation: { table: { disable: true } }, small: { table: { disable: true } } },
  render: () => (
    <ul className="fr-m-0 fr-p-0 flex list-none flex-col items-start gap-4">
      {formations.map((formation) => (
        <li className="fr-p-0 flex items-center gap-4" key={formation}>
          <FormationBadge formation={formation} />
          <FormationBadge formation={formation} small />
        </li>
      ))}
    </ul>
  ),
};
