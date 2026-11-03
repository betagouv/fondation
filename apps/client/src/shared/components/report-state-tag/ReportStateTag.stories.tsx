import type { Meta, StoryObj } from '@storybook/react-vite';

import { REPORT_STATUSES, type MemberReportStatusEnum } from '@/shared/enums/report-status.enum';

import { ReportStateTag } from './ReportStateTag';

const meta = {
  title: 'Shared/ReportStateTag',
  component: ReportStateTag,
  parameters: { layout: 'padded' },
  tags: ['autodocs'],
  argTypes: {
    state: {
      control: 'inline-radio',
      description: 'NOT_APPLICABLE: the reporter recused themselves',
      options: [...REPORT_STATUSES, 'NOT_APPLICABLE'] satisfies MemberReportStatusEnum[],
    },
  },
  args: { state: 'IN_PROGRESS' },
} satisfies Meta<typeof ReportStateTag>;

export default meta;

export const Playground: StoryObj<typeof meta> = {};
