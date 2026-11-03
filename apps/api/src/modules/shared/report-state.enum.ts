export const ReportStateEnum = {
  NEW: 'NEW',
  IN_PROGRESS: 'IN_PROGRESS',
  READY_TO_SUPPORT: 'READY_TO_SUPPORT',
  SUPPORTED: 'SUPPORTED',
} as const;
export type ReportStateEnum = (typeof ReportStateEnum)[keyof typeof ReportStateEnum];

/** what a reporter sees of their report: never recorded, only derived */
export const MemberReportStateEnum = { ...ReportStateEnum, NOT_APPLICABLE: 'NOT_APPLICABLE' } as const;
export type MemberReportStateEnum = (typeof MemberReportStateEnum)[keyof typeof MemberReportStateEnum];
