import { Transactional } from '@nestjs-cls/transactional';
import { Injectable } from '@nestjs/common';
import { createZodDto } from 'nestjs-zod';
import z from 'zod';

import { Prisma } from '../../../../generated/prisma/client';
import { COMMENT_MAX_LENGTH } from '../../../../utils/comment';
import { writerOf, writerSchema } from '../../../../utils/user.util';
import { Db } from '../../../framework/database';
import { HeldPositionFinder } from '../finders/held-position.finder';

@Injectable()
export class FindPositionCommentQuery {
  constructor(
    private readonly db: Db,
    private readonly heldPositions: HeldPositionFinder,
  ) {}

  @Transactional()
  async handle({ magistratId }: { magistratId: string }): Promise<FoundPositionCommentDto> {
    const { positionId } = await this.heldPositions.byHolder({ magistratId });

    const comment = await this.db.tx.positionComment.findUnique({
      select: {
        author: { select: { firstName: true, id: true, lastName: true } },
        comment: true,
        updatedAt: true,
      } satisfies Prisma.PositionCommentSelect,
      where: { primaryKey: { magistratId, positionId } },
    });

    return {
      comment: comment && {
        text: comment.comment,
        updatedAt: comment.updatedAt.toISOString(),
        updatedBy: writerOf(comment.author),
      },
      maxLength: COMMENT_MAX_LENGTH,
    };
  }
}

export class FoundPositionCommentDto extends createZodDto(
  z.object({
    comment: z.object({ text: z.string(), updatedAt: z.iso.datetime(), updatedBy: writerSchema }).nullable(),
    maxLength: z.number().int(),
  }),
) {}
