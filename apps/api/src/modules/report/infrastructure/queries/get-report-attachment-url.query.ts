import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { createZodDto } from 'nestjs-zod';
import z from 'zod';

import { Prisma } from '../../../../generated/prisma/client';
import { Db } from '../../../framework/database';
import { Files } from '../../../framework/files';
import type { Impersonation } from '../../../shared/policies/personal-content.policies';
import type { RoleEnum } from '../../../shared/role.enum';
import { reportAttachmentsVisibility } from '../../domain/report-lock';

@Injectable()
export class GetReportAttachmentUrlQuery {
  constructor(
    private readonly db: Db,
    private readonly files: Files,
  ) {}

  async handle(query: {
    fileId: string;
    reportId: string;
    user: { id: string; impersonation: Impersonation | undefined; role: RoleEnum };
  }): Promise<GeneratedReportAttachmentUrlDto> {
    if (reportAttachmentsVisibility(query.user) !== 'VISIBLE') throw new ForbiddenException();

    const attachment = await this.db.tx.reportFile.findUnique({
      select: { file: { select: { id: true, name: true } } } satisfies Prisma.ReportFileSelect,
      where: {
        primaryKey: { fileId: query.fileId, reportId: query.reportId },
        report: { isDeleted: false, reporterId: query.user.id },
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
