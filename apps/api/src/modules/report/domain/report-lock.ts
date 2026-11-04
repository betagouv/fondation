export const ReportLockEnum = {
  CLOSED_SESSION: 'CLOSED_SESSION',
  RECUSED: 'RECUSED',
} as const;
export type ReportLockEnum = (typeof ReportLockEnum)[keyof typeof ReportLockEnum];

/** a recused reporter no longer prepares the dossier: their report stays as it was until the recusal is withdrawn */
export function reportLock(
  session: { isOpen: boolean },
  reporter: { isRecused: boolean },
): ReportLockEnum | null {
  if (!session.isOpen) return 'CLOSED_SESSION';
  if (reporter.isRecused) return 'RECUSED';

  return null;
}
