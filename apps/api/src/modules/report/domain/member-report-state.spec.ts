import { memberReportState } from './member-report-state';

describe('memberReportState', () => {
  it('shows the recorded state of a reporter who did not recuse themselves', () => {
    expect(memberReportState({ state: 'READY_TO_SUPPORT' }, { isRecused: false })).toBe('READY_TO_SUPPORT');
  });

  it('shows a recused reporter that their report is not applicable', () => {
    expect(memberReportState({ state: 'READY_TO_SUPPORT' }, { isRecused: true })).toBe('NOT_APPLICABLE');
  });
});
