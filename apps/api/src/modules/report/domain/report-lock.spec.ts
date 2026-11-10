import { reportLock } from './report-lock';

describe('reportLock', () => {
  it('lets a reporter edit their report in an open session', () => {
    expect(reportLock({ isOpen: true })).toBeNull();
  });

  it('locks every report once the session is closed', () => {
    expect(reportLock({ isOpen: false })).toBe('CLOSED_SESSION');
  });
});
