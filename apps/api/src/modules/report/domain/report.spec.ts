import { randomUUID } from 'node:crypto';

import { ReportFileUsage } from 'shared-models';
import { FullName } from 'src/reports-context/business-logic/models/full-name';

import { Report, ReportFilesAttached, ReportFilesDetached } from './report';

describe('Report', () => {
  it('should attach a file to a report', () => {
    const reportId = randomUUID();
    const report = Report.from({
      id: reportId,
      sessionName: 'SESSION_NAME',
      nomAspirant: 'Jean MOULIN',
      reporterFullName: new FullName('Hannah', 'Arendt').fullName(),
    });

    const reporterId = randomUUID();
    report.attachFiles({
      reporterId,
      fileUsage: ReportFileUsage.ATTACHMENT,
      files: [
        { buffer: Buffer.from([]), name: `image.png`, type: 'image/png' },
      ],
    });

    const [filesAttached] = report.messages;

    expect(filesAttached).toBeInstanceOf(ReportFilesAttached);
    expect(filesAttached).toMatchObject({
      id: reportId,
      reporterId,
      usage: ReportFileUsage.ATTACHMENT,
      files: [
        {
          mimeType: 'image/png',
          path: `SESSION_NAME/Jean MOULIN/ARENDT Hannah/image.png`,
          buffer: expect.any(Buffer),
          meta: {
            id: expect.any(String),
            fileUsage: ReportFileUsage.ATTACHMENT,
          },
        },
      ],
    });
  });

  it('should ignore an empty list of files to attach', () => {
    const report = Report.from({
      id: randomUUID(),
      sessionName: 'SESSION_NAME',
      nomAspirant: 'Jean MOULIN',
      reporterFullName: new FullName('Hannah', 'Arendt').fullName(),
    });

    report.attachFiles({
      reporterId: randomUUID(),
      fileUsage: ReportFileUsage.ATTACHMENT,
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
      reporterFullName: new FullName('Hannah', 'Arendt').fullName(),
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
      reporterFullName: new FullName('Hannah', 'Arendt').fullName(),
    });

    report.detachFiles({ reporterId: randomUUID(), fileNames: [] });
    expect(report.messages).toHaveLength(0);
  });
});
