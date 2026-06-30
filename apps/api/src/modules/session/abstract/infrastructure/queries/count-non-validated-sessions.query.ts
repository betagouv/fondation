import { Injectable } from '@nestjs/common';
import { createZodDto } from 'nestjs-zod';
import z from 'zod';

import { Db } from 'src/modules/framework/database';

@Injectable()
export class CountNonValidatedSessionsQuery {
  constructor(private readonly db: Db) {}

  async handle(): Promise<CountUsersNewSessionsDto> {
    const count = await this.db.tx.session.count({
      where: { validatedAt: null, deletedAt: null },
    });

    return { count };
  }
}

export class CountUsersNewSessionsDto extends createZodDto(z.object({ count: z.number() })) {}
