import type { Meta, StoryObj } from '@storybook/react-vite';

import { REPORT_STATUSES } from '@/shared/enums/report-status.enum';

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

export const Playground: StoryObj<typeof meta> = {};
