import { randomUUID } from 'node:crypto';

import { Report, ReportFilesAttached, ReportFilesDetached } from './report';

describe('Report', () => {
  it('should attach a file to a report', () => {
    const reportId = randomUUID();
    const report = Report.from({
      id: reportId,
      sessionName: 'SESSION_NAME',
      nomAspirant: 'Jean MOULIN',
      reporterFullName: 'ARENDT Hannah',
    });

    const reporterId = randomUUID();
    report.attachFiles({
      reporterId,
      fileUsage: 'ATTACHMENT',
      files: [{ id: 'file-id' }],
    });

    const [filesAttached] = report.messages;

    expect(filesAttached).toBeInstanceOf(ReportFilesAttached);
    expect(filesAttached).toMatchObject({
      id: reportId,
      reporterId,
      usage: 'ATTACHMENT',
      files: [{ id: 'file-id' }],
    });
  });

  it('should ignore an empty list of files to attach', () => {
    const report = Report.from({
      id: randomUUID(),
      sessionName: 'SESSION_NAME',
      nomAspirant: 'Jean MOULIN',
      reporterFullName: 'ARENDT Hannah',
    });

    report.attachFiles({
      reporterId: randomUUID(),
      fileUsage: 'ATTACHMENT',
      files: [],
    });
    expect(report.messages).toHaveLength(0);
  });

  it('should detach files from report', () => {
    const reportId = randomUUID();
    const report = Report.from({
      id: reportId,
      sessionName: 'SESSION_NAME',
      nomAspirant: 'Jean MOULIN',
      reporterFullName: 'ARENDT Hannah',
    });

    const reporterId = randomUUID();
    report.detachFiles({ reporterId, fileNames: ['file to detach.pdf'] });

    const [filesDetached] = report.messages;

    expect(filesDetached).toBeInstanceOf(ReportFilesDetached);
    expect(filesDetached).toMatchObject({
      id: reportId,
      reporterId,
      fileNames: [`file to detach.pdf`],
    });
  });

  it('should ignore an empty list of file ids to detach', () => {
    const report = Report.from({
      id: randomUUID(),
      sessionName: 'SESSION_NAME',
      nomAspirant: 'Jean MOULIN',
      reporterFullName: 'ARENDT Hannah',
    });

    report.detachFiles({ reporterId: randomUUID(), fileNames: [] });
    expect(report.messages).toHaveLength(0);
  });
});
