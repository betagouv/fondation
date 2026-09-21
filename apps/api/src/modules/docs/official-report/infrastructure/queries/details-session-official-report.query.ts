import { Injectable, NotFoundException } from '@nestjs/common';
import { createZodDto } from 'nestjs-zod';
import z from 'zod';

import { OfficialReportVersionFinder } from '../finders/official-report-version.finder';
import { Db } from 'src/modules/framework/database';
import { Objects } from 'src/modules/framework/files';

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
        select: { officialReportId: true, pdf: { select: { id: true } } },
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
