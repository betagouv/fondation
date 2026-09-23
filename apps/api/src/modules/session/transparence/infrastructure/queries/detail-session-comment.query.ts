import { Injectable, NotFoundException } from '@nestjs/common';
import { createZodDto } from 'nestjs-zod';
import z from 'zod';

import { Prisma } from 'src/generated/prisma/client';
import { Db } from 'src/modules/framework/database';

@Injectable()
export class DetailSessionCommentQuery {
  constructor(private readonly db: Db) {}

  async handle(query: { sessionId: string }): Promise<DetailedSessionCommentDto> {
    const session = await this.db.tx.session.findUnique({
      select: { comment: true } satisfies Prisma.SessionSelect,
      where: { deletedAt: null, id: query.sessionId },
    });
    if (!session) throw new NotFoundException();

    return { comment: session.comment };
  }
}

export class DetailedSessionCommentDto extends createZodDto(z.object({ comment: z.string().nullable() })) {}
