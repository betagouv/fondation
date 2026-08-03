import { Injectable, NotFoundException } from '@nestjs/common';
import { createZodDto } from 'nestjs-zod';
import z from 'zod';

import { Db } from 'src/modules/framework/database';
import { Files } from 'src/modules/framework/files';

import { FindOfficialReportDocumentPdfQuery } from './find-official-report-document-pdf.query';

@Injectable()
export class DetailsSessionOfficialReportQuery {
  constructor(
    private readonly db: Db,
    private readonly files: Files,
    private readonly findOfficialReportDocumentPdfQuery: FindOfficialReportDocumentPdfQuery,
  ) {}

  async handle(query: { officialReportId: string }): Promise<DetailedSessionOfficialReportDto> {
    return this.innerHandle({ ...query, afterGeneration: false });
  }

  private async innerHandle(query: {
    officialReportId: string;
    afterGeneration: boolean;
  }): Promise<DetailedSessionOfficialReportDto> {
    const officialReport = await this.db.withTransaction(() =>
      this.db.tx.officialReport.findUnique({
        where: { id: query.officialReportId, html: { not: null } },
        select: { id: true, pdf: { select: { id: true } } },
      }),
    );

    if (!officialReport) throw new NotFoundException();
    if (!officialReport.pdf && query.afterGeneration) throw new NotFoundException();

    if (!officialReport.pdf) {
      await this.findOfficialReportDocumentPdfQuery.handle({ id: query.officialReportId, forceNew: false });
      return this.innerHandle({ ...query, afterGeneration: true });
    }

    const { [officialReport.pdf.id]: url } = await this.files.getPublicUrls([officialReport.pdf.id]);
    if (!url) throw new NotFoundException();

    return { id: officialReport.id, url: url.toString() };
  }
}

export class DetailedSessionOfficialReportDto extends createZodDto(
  z.object({
    id: z.string(),
    url: z.url(),
  }),
) {}
