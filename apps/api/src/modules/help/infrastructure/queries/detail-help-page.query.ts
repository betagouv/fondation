import { Injectable, NotFoundException } from '@nestjs/common';
import { createZodDto } from 'nestjs-zod';
import z from 'zod';

import { Prisma } from '../../../../generated/prisma/client';
import { isDefined } from '../../../../utils/is-defined';
import { writerOf, writerSchema } from '../../../../utils/user.util';
import { Db } from '../../../framework/database';
import { Files } from '../../../framework/files';
import type { RoleEnum } from '../../../shared/role.enum';
import { canReadHelpPage, type HelpPageEnum } from '../../domain/help-page';

@Injectable()
export class DetailHelpPageQuery {
  constructor(
    private readonly db: Db,
    private readonly files: Files,
  ) {}

  async handle(query: { page: HelpPageEnum; user: { role: RoleEnum } }): Promise<DetailedHelpPageDto> {
    if (!canReadHelpPage(query.page, query.user)) throw new NotFoundException();

    const helpPage = await this.db.tx.helpPage.findUnique({
      select: {
        content: true,
        screenshots: { select: { file: { select: { id: true, name: true } } }, where: { detachedAt: null } },
        updatedAt: true,
        updatedBy: { select: { firstName: true, id: true, lastName: true } },
      } satisfies Prisma.HelpPageSelect,
      where: { page: query.page },
    });
    if (!helpPage) throw new NotFoundException();

    const files = new Map(helpPage.screenshots.map(({ file }) => [file.id, file]));
    const urls = await this.files.getPublicUrls([...files.keys()]);

    return {
      content: helpPage.content,
      screenshots: Object.entries(urls)
        .map(([id, url]) => {
          const file = files.get(id);
          if (!file) return null;

          return {
            id: file.id,
            name: file.name,
            url: url.toString(),
          };
        })
        .filter(isDefined),
      updatedAt: helpPage.updatedAt.toISOString(),
      updatedBy: writerOf(helpPage.updatedBy),
    };
  }
}

export class DetailedHelpPageDto extends createZodDto(
  z.object({
    content: z.string(),
    screenshots: z.array(
      z.object({
        id: z.string(),
        name: z.string(),
        url: z.url(),
      }),
    ),
    updatedAt: z.iso.datetime(),
    updatedBy: writerSchema,
  }),
) {}
