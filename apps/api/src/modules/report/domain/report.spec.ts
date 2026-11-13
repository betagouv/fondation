import { randomUUID } from 'node:crypto';

import { Report, ReportAttachmentDetached, ReportFilesAttached } from './report';

describe('Report', () => {
  it('should attach a file to a report', () => {
    const reportId = randomUUID();
    const report = Report.from({
      id: reportId,
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
    });

    report.attachFiles({
      reporterId: randomUUID(),
      fileUsage: 'ATTACHMENT',
      files: [],
    });
    expect(report.messages).toHaveLength(0);
  });

  it('should detach an attachment from report by its id', () => {
    const reportId = randomUUID();
    const fileId = randomUUID();
    const report = Report.from({ id: reportId });

    report.detachAttachment({ fileId });

    expect(report.messages).toEqual([new ReportAttachmentDetached(reportId, fileId)]);
  });
});
