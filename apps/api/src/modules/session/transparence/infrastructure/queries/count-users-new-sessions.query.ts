import { Injectable } from '@nestjs/common';
import { createZodDto } from 'nestjs-zod';
import z from 'zod';

import { Db } from '../../../../framework/database';

@Injectable()
export class CountUsersNewSessionsQuery {
  constructor(private readonly db: Db) {}

  async handle(): Promise<CountUsersNewSessionsDto> {
    const count = await this.db.tx.session.count({
      where: { archivedAt: null, deletedAt: null, validatedAt: null },
    });

    return { count };
  }
}

export class CountUsersNewSessionsDto extends createZodDto(z.object({ count: z.number() })) {}
