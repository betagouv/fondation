import { Injectable, NotFoundException } from '@nestjs/common';
import { createZodDto } from 'nestjs-zod';
import z from 'zod';

import { Prisma } from '../../../../generated/prisma/client';
import { Db } from '../../../framework/database';

@Injectable()
export class FindMagistratStatusQuery {
  constructor(private readonly db: Db) {}

  async handle(query: { magistratId: string }): Promise<FoundMagistratStatusDto> {
    const magistrat = await this.db.tx.magistrat.findUnique({
      where: { id: query.magistratId },
      select: { status: true } satisfies Prisma.MagistratSelect,
    });
    // Fondation never deletes a magistrat: the partner takes an unknown identifier for an incident, not for a departure
    if (!magistrat) throw new NotFoundException();

    return { status: magistrat.status };
  }
}

export class FoundMagistratStatusDto extends createZodDto(
  z.object({
    status: z.enum(['ACTIVE', 'INACTIVE']).meta({
      description:
        '- `ACTIVE`: the _Magistrat_ is in the last LOLFI extraction imported successfully\n' +
        '- `INACTIVE`: it is no longer',
    }),
  }),
) {}
