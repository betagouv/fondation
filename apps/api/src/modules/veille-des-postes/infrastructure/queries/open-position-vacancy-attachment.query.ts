import { Transactional } from '@nestjs-cls/transactional';
import { Injectable, NotFoundException } from '@nestjs/common';
import { createZodDto } from 'nestjs-zod';
import z from 'zod';

import { Prisma } from '../../../../generated/prisma/client';
import { Db } from '../../../framework/database';
import { Files } from '../../../framework/files';
import { HeldPositionFinder } from '../finders/held-position.finder';

@Injectable()
export class OpenPositionVacancyAttachmentQuery {
  constructor(
    private readonly db: Db,
    private readonly files: Files,
    private readonly heldPositions: HeldPositionFinder,
  ) {}

  @Transactional()
  async handle(query: { fileId: string; magistratId: string }): Promise<OpenedPositionVacancyAttachmentDto> {
    const { positionId } = await this.heldPositions.byHolder(query);
    const attachment = await this.db.tx.positionVacancyAttachment.findUnique({
      select: { file: { select: { id: true, name: true } } } satisfies Prisma.PositionVacancyAttachmentSelect,
      where: { primaryKey: { fileId: query.fileId, magistratId: query.magistratId, positionId } },
    });
    if (!attachment) throw new NotFoundException();

    const { [attachment.file.id]: url } = await this.files.getPublicUrls([attachment.file.id]);
    if (!url) throw new NotFoundException();

    return { id: attachment.file.id, name: attachment.file.name, url: url.toString() };
  }
}

export class OpenedPositionVacancyAttachmentDto extends createZodDto(
  z.object({ id: z.string(), name: z.string(), url: z.url() }),
) {}
