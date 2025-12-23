import assert from 'node:assert';

import { Injectable, NotFoundException } from '@nestjs/common';
import { createZodDto } from 'nestjs-zod';
import z from 'zod';

import { PrismaService } from 'src/modules/framework/database';
import { Files } from 'src/modules/framework/files';
import { isDefined } from 'src/utils/is-defined';

@Injectable()
export class GetReportFileUrlsQuery {
  constructor(
    private readonly prisma: PrismaService,
    private readonly files: Files,
  ) {}

  async handle(query: {
    userId: string;
    reportId: string;
    fileNames: readonly string[];
  }): Promise<GetReportFileUrlsResponseDto> {
    assert.ok(query.fileNames.length <= 30);

    const report = await this.prisma.report.findFirst({
      where: { reporterId: query.userId, id: query.reportId, isDeleted: false },
      select: {
        files: {
          where: { file: { name: { in: query.fileNames as string[] } } },
          select: { file: { select: { id: true, name: true, path: true } } },
        },
      },
    });

    if (!report) throw new NotFoundException();

    const files = new Map(
      report.files.map(
        ({ file }) =>
          [
            file.id,
            { id: file.id, name: file.name, path: file.path.join('/') },
          ] as const,
      ),
    );

    const fileUrls = await this.files.getPublicUrls(Array.from(files.keys()));

    return {
      items: Object.entries(fileUrls)
        .map(([fileId, fileUrl]) => {
          const file = files.get(fileId);
          return file
            ? { id: file.id, name: file.name, url: fileUrl.toString() }
            : undefined;
        })
        .filter(isDefined),
    };
  }
}

export class GetReportFileUrlsResponseDto extends createZodDto(
  z.object({
    items: z.array(
      z.object({ id: z.string(), name: z.string(), url: z.url() }),
    ),
  }),
) {}
