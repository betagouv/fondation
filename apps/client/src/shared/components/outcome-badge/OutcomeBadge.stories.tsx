import type { Meta, StoryObj } from '@storybook/react-vite';

import { FormationEnum, NominationFileOutcomeEnum } from '@/types/enums.types';

import { OutcomeBadge } from './OutcomeBadge';

const formations = Object.values(FormationEnum);
const outcomes = Object.values(NominationFileOutcomeEnum);

const meta = {
  title: 'Shared/OutcomeBadge',
  component: OutcomeBadge,
  parameters: { layout: 'padded' },
  tags: ['autodocs'],
  argTypes: {
    acronym: { control: 'boolean' },
    formation: { control: 'inline-radio', options: formations },
    label: { table: { disable: true } },
    outcome: { control: 'inline-radio', options: outcomes },
    small: { control: 'boolean' },
  },
  args: {
    acronym: false,
    formation: FormationEnum.SIEGE,
    outcome: NominationFileOutcomeEnum.VALIDATED,
    small: true,
  },
} satisfies Meta<typeof OutcomeBadge>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

export const Outcomes: Story = {
  argTypes: {
    formation: { table: { disable: true } },
    outcome: { table: { disable: true } },
  },
  render: (args) => (
    <div className="flex flex-col gap-6">
      {formations.map((formation) => (
        <section key={formation}>
          <h2 className="fr-h6 fr-mb-2v">{formation}</h2>
          <ul className="fr-m-0 fr-p-0 flex list-none flex-wrap items-center gap-4">
            {outcomes.map((outcome) => (
              <li className="fr-p-0" key={outcome}>
                <OutcomeBadge
                  acronym={args.acronym}
                  formation={formation}
                  outcome={outcome}
                  small={args.small}
                />
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  ),
};

export const Acronyms: Story = {
  ...Outcomes,
  args: { acronym: true },
};
