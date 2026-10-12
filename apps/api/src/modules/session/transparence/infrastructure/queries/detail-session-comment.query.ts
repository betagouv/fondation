import { Injectable, NotFoundException } from '@nestjs/common';
import { createZodDto } from 'nestjs-zod';
import z from 'zod';

import { Prisma } from 'src/generated/prisma/client';
import { Db } from 'src/modules/framework/database';
import { fullname } from 'src/utils/user.util';

@Injectable()
export class DetailSessionCommentQuery {
  constructor(private readonly db: Db) {}

  async handle(query: { sessionId: string }): Promise<DetailedSessionCommentDto> {
    const session = await this.db.tx.session.findUnique({
      select: {
        comment: true,
        commentVersions: {
          orderBy: { writtenAt: 'desc' },
          select: { author: { select: { firstName: true, id: true, lastName: true } }, writtenAt: true },
          take: 1,
        },
      } satisfies Prisma.SessionSelect,
      where: { deletedAt: null, id: query.sessionId },
    });
    if (!session) throw new NotFoundException();

    const [lastVersion] = session.commentVersions;
    const author = lastVersion?.author;
    return {
      comment: session.comment,
      writtenAt: lastVersion?.writtenAt.toISOString() ?? null,
      writtenBy: author ? { id: author.id, name: fullname(author) } : null,
    };
  }
}

export class DetailedSessionCommentDto extends createZodDto(
  z.object({
    comment: z.string().nullable(),
    writtenAt: z.iso.datetime().nullable(),
    writtenBy: z.object({ id: z.string(), name: z.string() }).nullable(),
  }),
) {}
