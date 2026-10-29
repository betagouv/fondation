// oxlint-disable typescript/unbound-method
import { mock, type MockProxy } from 'vitest-mock-extended';

import { OfficialReportVersionDelegate } from '../../../../../generated/prisma/models';
import { Db } from '../../../../framework/database';
import { Files } from '../../../../framework/files';
import { PdfRenderer } from '../../../../framework/pdf';
import { OfficialReportVersionFinder } from '../finders/official-report-version.finder';

import { FindOfficialReportDocumentPdfQuery } from './find-official-report-document-pdf.query';
import { FindOfficialReportDocumentQuery } from './find-official-report-document.query';

describe('FindOfficialReportDocumentPdfQuery', () => {
  let tx: { officialReportVersion: MockProxy<OfficialReportVersionDelegate> };
  let files: MockProxy<Files>;
  let query: FindOfficialReportDocumentPdfQuery;

  beforeEach(() => {
    tx = { officialReportVersion: mock() };
    // comparing the delegate to a deep partial of the Prisma client exhausts the compiler
    const db = mock<Db>({ tx: tx as never });

    const officialReportVersionFinder = mock<OfficialReportVersionFinder>();
    officialReportVersionFinder.latest.mockResolvedValue('version-id');
    const findOfficialReportDocumentQuery = mock<FindOfficialReportDocumentQuery>();
    findOfficialReportDocumentQuery.handle.mockResolvedValue('<p>PV</p>');
    const pdfRenderer = mock<PdfRenderer>();
    pdfRenderer.render.mockResolvedValue(Buffer.from('%PDF'));

    files = mock<Files>();
    files.create.mockResolvedValue(['rendered-id']);
    query = new FindOfficialReportDocumentPdfQuery(
      files,
      db,
      pdfRenderer,
      findOfficialReportDocumentQuery,
      officialReportVersionFinder,
    );

    tx.officialReportVersion.findUnique.mockResolvedValue({
      chairmanFirstName: 'Jeanne',
      chairmanLastName: 'Martin',
      officialReport: {
        agenda: { formation: 'SIEGE', sessionId: 'session-id', sessionName: 'Transparence' },
      },
      pdf: null,
      sessionMeetingDate: new Date('2026-02-10'),
    } as never);
  });

  it('should attach the rendered PDF to a version that holds none', async () => {
    tx.officialReportVersion.updateMany.mockResolvedValue({ count: 1 });

    await query.handle({ forceNew: true, id: 'official-report-id' });

    expect(tx.officialReportVersion.updateMany).toHaveBeenCalledWith({
      data: { pdfId: 'rendered-id' },
      where: { id: 'version-id', pdfId: null },
    });
    expect(files.delete).not.toHaveBeenCalled();
  });

  it('should delete the rendered PDF when another validation attached one meanwhile', async () => {
    tx.officialReportVersion.updateMany.mockResolvedValue({ count: 0 });

    await query.handle({ forceNew: true, id: 'official-report-id' });

    expect(files.delete).toHaveBeenCalledExactlyOnceWith([
      {
        id: 'rendered-id',
        path: ['sessions', 'session-id', 'official-reports', 'official-report-id', 'version-id.pdf'],
      },
    ]);
  });
});
