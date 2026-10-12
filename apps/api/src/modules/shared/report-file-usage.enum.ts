export const ReportFileUsageEnum = {
  ATTACHMENT: 'ATTACHMENT',
  EMBEDDED_SCREENSHOT: 'EMBEDDED_SCREENSHOT',
} as const;
export type ReportFileUsageEnum = (typeof ReportFileUsageEnum)[keyof typeof ReportFileUsageEnum];
