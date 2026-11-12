export const ReportLockEnum = {
  CLOSED_SESSION: 'CLOSED_SESSION',
} as const;
export type ReportLockEnum = (typeof ReportLockEnum)[keyof typeof ReportLockEnum];

export function reportLock(session: { isOpen: boolean }): ReportLockEnum | null {
  return session.isOpen ? null : 'CLOSED_SESSION';
}
