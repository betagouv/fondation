import { Transactional } from '@nestjs-cls/transactional';
import { Injectable } from '@nestjs/common';
import { createZodDto } from 'nestjs-zod';
import z from 'zod';

import { Prisma } from '../../../../generated/prisma/client';
import { COMMENT_MAX_LENGTH, commentLastChangeSchema } from '../../../../utils/comment';
import { writerOf } from '../../../../utils/user.util';
import { Db } from '../../../framework/database';
import { CommentedPositionFinder } from '../finders/commented-position.finder';

const COMMENT_SELECT = {
  author: { select: { firstName: true, id: true, lastName: true } },
  comment: true,
  updatedAt: true,
} satisfies Prisma.CourtCommentSelect & Prisma.PositionCommentSelect;

@Injectable()
export class FindPositionCommentQuery {
  constructor(
    private readonly commentedPositions: CommentedPositionFinder,
    private readonly db: Db,
  ) {}

  @Transactional()
  async handle(query: { courtId: string } | { magistratId: string }): Promise<FoundPositionCommentDto> {
    const position =
      'courtId' in query
        ? await this.commentedPositions.ofCourt(query)
        : await this.commentedPositions.ofHolder(query);

    const comment =
      'courtId' in position
        ? await this.db.tx.courtComment.findUnique({
            select: COMMENT_SELECT satisfies Prisma.CourtCommentSelect,
            where: { courtId: position.courtId },
          })
        : await this.db.tx.positionComment.findUnique({
            select: COMMENT_SELECT satisfies Prisma.PositionCommentSelect,
            where: { primaryKey: position },
          });

    return {
      comment: comment?.comment ?? null,
      lastChange: comment && { at: comment.updatedAt.toISOString(), by: writerOf(comment.author) },
      maxLength: COMMENT_MAX_LENGTH,
    };
  }
}

export class FoundPositionCommentDto extends createZodDto(
  z.object({
    comment: z.string().nullable(),
    lastChange: commentLastChangeSchema.nullable(),
    maxLength: z.number().int(),
  }),
) {}
