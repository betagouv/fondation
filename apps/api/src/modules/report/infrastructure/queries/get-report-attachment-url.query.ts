import { Injectable, NotFoundException } from '@nestjs/common';
import { createZodDto } from 'nestjs-zod';
import z from 'zod';

import { Prisma } from '../../../../generated/prisma/client';
import { Db } from '../../../framework/database';
import { Files } from '../../../framework/files';

@Injectable()
export class GetReportAttachmentUrlQuery {
  constructor(
    private readonly db: Db,
    private readonly files: Files,
  ) {}

  async handle(query: {
    fileId: string;
    reportId: string;
    userId: string;
  }): Promise<GeneratedReportAttachmentUrlDto> {
    const attachment = await this.db.tx.reportFile.findUnique({
      select: { file: { select: { id: true, name: true } } } satisfies Prisma.ReportFileSelect,
      where: {
        primaryKey: { fileId: query.fileId, reportId: query.reportId },
        report: { isDeleted: false, reporterId: query.userId },
        usage: 'ATTACHMENT',
      },
    });
    if (!attachment) throw new NotFoundException();

    const { [attachment.file.id]: url } = await this.files.getPublicUrls([attachment.file.id]);
    if (!url) throw new NotFoundException();

    return { id: attachment.file.id, name: attachment.file.name, url: url.toString() };
  }
}

export class GeneratedReportAttachmentUrlDto extends createZodDto(
  z.object({ id: z.string(), name: z.string(), url: z.url() }),
) {}
