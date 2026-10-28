// oxlint-disable typescript/unbound-method
import { mock, type MockProxy } from 'vitest-mock-extended';

import { AgendaVersionDelegate } from '../../../../../generated/prisma/models';
import { Db } from '../../../../framework/database';
import { Files } from '../../../../framework/files';
import { PdfRenderer } from '../../../../framework/pdf';
import { AgendaVersionFinder } from '../finders/agenda-version.finder';

import { FindAgendaDocumentPdfQuery } from './find-agenda-document-pdf.query';
import { FindAgendaDocumentQuery } from './find-agenda-document.query';

describe('FindAgendaDocumentPdfQuery', () => {
  let tx: { agendaVersion: MockProxy<AgendaVersionDelegate> };
  let files: MockProxy<Files>;
  let query: FindAgendaDocumentPdfQuery;

  beforeEach(() => {
    tx = { agendaVersion: mock() };
    // comparing the delegate to a deep partial of the Prisma client exhausts the compiler
    const db = mock<Db>({ tx: tx as never });

    const agendaVersionFinder = mock<AgendaVersionFinder>();
    agendaVersionFinder.latest.mockResolvedValue('version-id');
    const findAgendaDocumentQuery = mock<FindAgendaDocumentQuery>();
    findAgendaDocumentQuery.handle.mockResolvedValue('<p>ODJ</p>');
    const pdfRenderer = mock<PdfRenderer>();
    pdfRenderer.render.mockResolvedValue(Buffer.from('%PDF'));

    files = mock<Files>();
    files.create.mockResolvedValue(['rendered-id']);
    query = new FindAgendaDocumentPdfQuery(
      files,
      db,
      pdfRenderer,
      findAgendaDocumentQuery,
      agendaVersionFinder,
    );

    tx.agendaVersion.findUnique.mockResolvedValue({
      agenda: { formation: 'SIEGE', sessionId: 'session-id', sessionName: 'Transparence' },
      chairmanFirstName: 'Jeanne',
      chairmanLastName: 'Martin',
      pdf: null,
      sessionMeetingDate: new Date('2026-02-10'),
    } as never);
  });

  it('should attach the rendered PDF to a version that holds none', async () => {
    tx.agendaVersion.updateMany.mockResolvedValue({ count: 1 });

    await query.handle({ forceNew: true, id: 'agenda-id' });

    expect(tx.agendaVersion.updateMany).toHaveBeenCalledWith({
      data: { pdfFileId: 'rendered-id' },
      where: { id: 'version-id', pdfFileId: null },
    });
    expect(files.delete).not.toHaveBeenCalled();
  });

  it('should delete the rendered PDF when another validation attached one meanwhile', async () => {
    tx.agendaVersion.updateMany.mockResolvedValue({ count: 0 });

    await query.handle({ forceNew: true, id: 'agenda-id' });

    expect(files.delete).toHaveBeenCalledExactlyOnceWith([
      { id: 'rendered-id', path: ['sessions', 'session-id', 'agendas', 'agenda-id', 'version-id.pdf'] },
    ]);
  });
});
