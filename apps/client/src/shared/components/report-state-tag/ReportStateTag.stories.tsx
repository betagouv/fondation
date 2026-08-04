import type { Meta, StoryObj } from '@storybook/react-vite';

import { REPORT_STATUSES } from '@/types/enums.types';

import { ReportStateTag } from './ReportStateTag';

const meta = {
  title: 'Shared/ReportStateTag',
  component: ReportStateTag,
  parameters: { layout: 'padded' },
  tags: ['autodocs'],
  argTypes: {
    state: { control: 'inline-radio', options: REPORT_STATUSES },
  },
  args: { state: 'IN_PROGRESS' },
} satisfies Meta<typeof ReportStateTag>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

export const States: Story = {
  argTypes: { state: { table: { disable: true } } },
  render: () => (
    <ul className="fr-m-0 fr-p-0 flex list-none flex-col items-start gap-4">
      {REPORT_STATUSES.map((state) => (
        <li className="fr-p-0" key={state}>
          <ReportStateTag state={state} />
        </li>
      ))}
    </ul>
  ),
};
