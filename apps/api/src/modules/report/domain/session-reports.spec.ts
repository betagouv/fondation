import { ReportsCreated, ReportsDeleted, ReportsRestored, SessionReports } from './session-reports';

const affectation = { nominationFileId: 'file-1', reporterId: 'reporter-1' };

function report(props: { createdAt?: string; hasContent?: boolean; id: string; isDeleted: boolean }) {
  return {
    ...affectation,
    createdAt: new Date(props.createdAt ?? '2026-03-11T10:00:00Z'),
    hasContent: props.hasContent ?? false,
    id: props.id,
    isDeleted: props.isDeleted,
  };
}

function sync(reports: ReturnType<typeof report>[], affectations = [affectation]) {
  const sessionReports = SessionReports.from({ reports, sessionId: 'session-1' });
  sessionReports.syncWith({ affectations, formation: 'PARQUET' });
  return sessionReports.messages;
}

describe('SessionReports', () => {
  it('should create a report for a reporter newly affected', () => {
    expect(sync([])).toEqual([new ReportsCreated('session-1', 'PARQUET', [affectation])]);
  });

  it('should delete the report of a reporter taken off a file', () => {
    expect(sync([report({ id: 'report-1', isDeleted: false })], [])).toEqual([
      new ReportsDeleted(['report-1']),
    ]);
  });

  it('should restore the report of a reporter affected again', () => {
    expect(sync([report({ id: 'report-1', isDeleted: true })])).toEqual([new ReportsRestored(['report-1'])]);
  });

  it('should leave alone the reports already in place', () => {
    expect(
      sync([
        report({ id: 'report-1', isDeleted: false }),
        { ...report({ id: 'report-2', isDeleted: true }), nominationFileId: 'file-2' },
      ]),
    ).toEqual([]);
  });

  it('should restore no deleted report next to an active one', () => {
    expect(
      sync([
        report({ id: 'report-1', isDeleted: false }),
        report({ hasContent: true, id: 'report-2', isDeleted: true }),
      ]),
    ).toEqual([]);
  });

  it('should restore only the deleted report holding content', () => {
    expect(
      sync([
        report({ createdAt: '2026-03-13T10:00:00Z', id: 'report-1', isDeleted: true }),
        report({ createdAt: '2026-03-11T10:00:00Z', hasContent: true, id: 'report-2', isDeleted: true }),
      ]),
    ).toEqual([new ReportsRestored(['report-2'])]);
  });

  it('should restore only the latest deleted report when none holds content', () => {
    expect(
      sync([
        report({ createdAt: '2026-03-11T10:00:00Z', id: 'report-1', isDeleted: true }),
        report({ createdAt: '2026-03-13T10:00:00Z', id: 'report-2', isDeleted: true }),
      ]),
    ).toEqual([new ReportsRestored(['report-2'])]);
  });
});
