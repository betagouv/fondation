import { reportLock } from './report-lock';

describe('reportLock', () => {
  it('lets a reporter who did not recuse themselves edit their report in an open session', () => {
    expect(reportLock({ isOpen: true }, { isRecused: false })).toBeNull();
  });

  it('locks the report of a recused reporter', () => {
    expect(reportLock({ isOpen: true }, { isRecused: true })).toBe('RECUSED');
  });

  it('locks every report once the session is closed', () => {
    expect(reportLock({ isOpen: false }, { isRecused: true })).toBe('CLOSED_SESSION');
  });
});
