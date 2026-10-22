import { Injectable, NotFoundException } from '@nestjs/common';
import { createZodDto } from 'nestjs-zod';
import z from 'zod';

import { Prisma } from '../../../../generated/prisma/client';
import { isDefined } from '../../../../utils/is-defined';
import { writerOf, writerSchema } from '../../../../utils/user.util';
import { Db } from '../../../framework/database';
import { Files } from '../../../framework/files';
import { prismaReportStateEnumToReportState } from '../../../shared/mappers/rapport-statut.mapper';
import { prismaReportFileUsageEnumToReportFileUsage } from '../../../shared/mappers/report-file-usage.mapper';
import { ReportStateEnum } from '../../../shared/report-state.enum';
import { isSecretariat, type RoleEnum } from '../../../shared/role.enum';

@Injectable()
export class DetailReportQuery {
  constructor(
    private readonly files: Files,
    private readonly db: Db,
  ) {}

  async handle(query: {
    reportId: string;
    user: { id: string; role: RoleEnum };
  }): Promise<DetailedReportDto> {
    const reporterId = isSecretariat(query.user.role) ? undefined : query.user.id;

    const report = await this.db.tx.report.findUnique({
      select: {
        comment: true,
        files: {
          select: {
            file: {
              select: {
                createdAt: true,
                createdBy: { select: { firstName: true, id: true, lastName: true } },
                id: true,
                name: true,
                path: true,
                sizeInBytes: true,
              },
            },
            usage: true,
          },
        },
        id: true,
        nominationFileId: true,
        sessionId: true,
        state: true,
      } satisfies Prisma.ReportSelect,
      where: { id: query.reportId, isDeleted: false, reporterId },
    });

    if (!report) throw new NotFoundException();

    const reportFiles = report.files.map(({ file, usage }) => ({
      addedAt: file.createdAt.toISOString(),
      addedBy: writerOf(file.createdBy),
      id: file.id,
      name: file.name,
      path: file.path,
      size: file.sizeInBytes,
      usage: prismaReportFileUsageEnumToReportFileUsage(usage),
    }));

    const attachments = reportFiles.filter(
      (x): x is typeof x & { usage: 'ATTACHMENT' } => x.usage === 'ATTACHMENT',
    );

    const screenshots = await this.withUrls(
      reportFiles.filter(
        (x): x is typeof x & { usage: 'EMBEDDED_SCREENSHOT' } => x.usage === 'EMBEDDED_SCREENSHOT',
      ),
    );

    return {
      attachments: attachments.map((f) => ({
        addedAt: f.addedAt,
        addedBy: f.addedBy,
        id: f.id,
        name: f.name,
        size: f.size,
        usage: f.usage,
      })),
      comment: report.comment,
      id: report.id,
      nominationFileId: report.nominationFileId,
      screenshots: screenshots.map((f) => ({
        id: f.id,
        name: f.name,
        url: f.url,
        usage: f.usage,
      })),
      sessionId: report.sessionId,
      state: prismaReportStateEnumToReportState(report.state),
    };
  }

  private async withUrls<F extends { id: string; name: string; path: readonly string[] }>(
    files: readonly F[],
  ): Promise<(F & { url: string })[]> {
    const byId = new Map(files.map((f) => [f.id, f]));
    const urls = await this.files.getPublicUrls(Array.from(byId.keys()));

    return Object.entries(urls)
      .map(([path, url]) => {
        const originalFile = byId.get(path);
        if (!originalFile) return undefined;

        return { ...originalFile, url: url.toString() };
      })
      .filter(isDefined);
  }
}

export class DetailedReportDto extends createZodDto(
  z.object({
    id: z.string(),
    sessionId: z.string(),
    nominationFileId: z.string(),
    comment: z.string().nullable(),
    state: z.enum(ReportStateEnum),

    screenshots: z.array(
      z.object({
        usage: z.enum(['EMBEDDED_SCREENSHOT']),
        name: z.string(),
        id: z.string(),
        url: z.url(),
      }),
    ),

    attachments: z.array(
      z.object({
        usage: z.enum(['ATTACHMENT']),
        name: z.string(),
        id: z.string(),
        size: z.number().int().nullable(),
        addedAt: z.iso.datetime(),
        addedBy: writerSchema,
      }),
    ),
  }),
) {}
