import { Injectable, NotFoundException } from '@nestjs/common';
import { createZodDto } from 'nestjs-zod';
import z from 'zod';

import { Prisma } from '../../../../../generated/prisma/client';
import { Db } from '../../../../framework/database';
import { Objects } from '../../../../framework/files';
import { OfficialReportVersionFinder } from '../finders/official-report-version.finder';

@Injectable()
export class DetailsSessionOfficialReportQuery {
  constructor(
    private readonly db: Db,
    private readonly objects: Objects,
    private readonly officialReportVersionFinder: OfficialReportVersionFinder,
  ) {}

  async handle(query: { officialReportId: string }): Promise<DetailedSessionOfficialReportDto> {
    const publishedVersionId = await this.officialReportVersionFinder.published(query);
    if (!publishedVersionId) throw new NotFoundException();

    const version = await this.db.withTransaction(() =>
      this.db.tx.officialReportVersion.findUnique({
        where: { id: publishedVersionId },
        select: {
          officialReportId: true,
          pdf: { select: { id: true } },
        } satisfies Prisma.OfficialReportVersionSelect,
      }),
    );

    if (!version?.pdf) throw new NotFoundException();

    const [{ url } = {}] = await this.objects.publish([{ id: version.pdf.id }]);
    if (!url) throw new NotFoundException();

    return { id: version.officialReportId, url: url.toString() };
  }
}

export class DetailedSessionOfficialReportDto extends createZodDto(
  z.object({
    id: z.string(),
    url: z.url(),
  }),
) {}
