import { Injectable, NotFoundException } from '@nestjs/common';
import { createZodDto } from 'nestjs-zod';
import z from 'zod';

import { PrismaService } from 'src/modules/framework/database';
import { Files } from 'src/modules/framework/files';

@Injectable()
export class DetailsSessionOfficialReportQuery {
  constructor(
    private readonly prisma: PrismaService,
    private readonly files: Files,
  ) {}

  async handle(query: { officialReportId: string }) {
    const file = await this.prisma.officialReport.findUnique({
      where: { id: query.officialReportId },
      select: { id: true, pdf: { select: { id: true } } },
    });

    if (!file || !file.pdf) throw new NotFoundException();

    const { [file.pdf.id]: url } = await this.files.getPublicUrls([file.pdf.id]);

    if (!url) throw new NotFoundException();

    return { id: file.id, url: url.toString() };
  }
}

export class DetailedSessionOfficialReportDto extends createZodDto(
  z.object({
    id: z.string(),
    url: z.url(),
  }),
) {}
