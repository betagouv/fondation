export const ReportStateEnum = {
  NEW: 'NEW',
  IN_PROGRESS: 'IN_PROGRESS',
  READY_TO_SUPPORT: 'READY_TO_SUPPORT',
  SUPPORTED: 'SUPPORTED',
} as const;
export type ReportStateEnum = (typeof ReportStateEnum)[keyof typeof ReportStateEnum];
