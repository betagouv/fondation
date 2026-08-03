import { Injectable, NotFoundException } from '@nestjs/common';
import { createZodDto } from 'nestjs-zod';
import z from 'zod';

import { Db } from 'src/modules/framework/database';
import { Files } from 'src/modules/framework/files';
import { FILE_MIME_TYPES, filenameToMimeType } from 'src/modules/framework/files/mime-type';
import { isDefined } from 'src/utils/is-defined';

@Injectable()
export class GetSummaryAttachmentUrlQuery {
  constructor(
    private readonly db: Db,
    private readonly files: Files,
  ) {}

  async handle(query: {
    userId: string;
    sessionId: string;
    nominationFileId: string;
    fileId: string;
  }): Promise<GeneratedSummaryAttachmentPublicUrlDto> {
    const session = await this.db.tx.session.findUnique({
      where: { id: query.sessionId, deletedAt: null },
      select: {
        dossierDeNominations: {
          where: { id: query.nominationFileId },
          select: {
            summary: {
              select: {
                authorId: true,
                readers: { select: { userId: true } },
                attachments: {
                  where: { fileId: query.fileId },
                  select: {
                    file: {
                      select: {
                        id: true,
                        name: true,
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    });

    const summary = session?.dossierDeNominations[0]?.summary;
    if (!summary) throw new NotFoundException();

    const file = summary.attachments[0]?.file;
    if (!file) throw new NotFoundException();

    const allReaders = ([] as (string | null)[])
      .concat(
        summary.readers.map(({ userId }) => userId),
        summary.authorId,
      )
      .filter(isDefined);
    if (!allReaders.includes(query.userId)) throw new NotFoundException();

    const { [file.id]: url } = await this.files.getPublicUrls([file.id]);
    if (!url) throw new NotFoundException();

    return {
      id: file.id,
      name: file.name,
      type: filenameToMimeType(file.name) ?? FILE_MIME_TYPES.bin,
      url: url.toString(),
    };
  }
}

export class GeneratedSummaryAttachmentPublicUrlDto extends createZodDto(
  z.object({
    id: z.string(),
    name: z.string(),
    type: z.string(),
    url: z.url(),
  }),
) {}
