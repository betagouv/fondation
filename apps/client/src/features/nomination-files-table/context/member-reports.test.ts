import { describe, expect, it } from 'vitest';

import { MemberReports } from './member-reports';

describe('MemberReports', () => {
  it('finds the report of a nomination file', () => {
    const model = MemberReports.fromReports([
      { nominationFileId: 'file-1', report: { id: 'report-1', state: 'IN_PROGRESS' } },
      { nominationFileId: 'file-2', report: { id: 'report-2', state: 'NEW' } },
    ]);

    expect(model.reportFor('file-2')).toEqual({ id: 'report-2', state: 'NEW' });
  });

  it('has no report for a file the member does not report on', () => {
    const model = MemberReports.fromReports([
      { nominationFileId: 'file-1', report: { id: 'report-1', state: 'IN_PROGRESS' } },
    ]);

    expect(model.reportFor('file-2')).toBeUndefined();
  });

  it('has no report when the member reports on nothing', () => {
    const model = MemberReports.fromReports([]);

    expect(model.reportFor('file-1')).toBeUndefined();
  });
});
