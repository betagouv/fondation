export const ReportStateEnum = {
  NEW: 'NEW',
  IN_PROGRESS: 'IN_PROGRESS',
  READY_TO_SUPPORT: 'READY_TO_SUPPORT',
  SUPPORTED: 'SUPPORTED',
} as const;
export type ReportStateEnum = (typeof ReportStateEnum)[keyof typeof ReportStateEnum];

export type ReportStateCounts = Record<ReportStateEnum, number>;

export function noReportStates(): ReportStateCounts {
  return { IN_PROGRESS: 0, NEW: 0, READY_TO_SUPPORT: 0, SUPPORTED: 0 };
}
