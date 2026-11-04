import type { MemberReportStateEnum, ReportStateEnum } from '../../shared/report-state.enum';

/** a recused reporter has nothing left to report on; withdrawing the recusal brings the recorded state back */
export function memberReportState(
  report: { state: ReportStateEnum },
  reporter: { isRecused: boolean },
): MemberReportStateEnum {
  return reporter.isRecused ? 'NOT_APPLICABLE' : report.state;
}
