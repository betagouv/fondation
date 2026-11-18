import { Injectable } from '@nestjs/common';
import { createZodDto } from 'nestjs-zod';
import z from 'zod';

import { Prisma } from '../../../../generated/prisma/client';
import { Db } from '../../../framework/database';

@Injectable()
export class IdentifyMagistratQuery {
  constructor(private readonly db: Db) {}

  async handle(query: { email: string }): Promise<IdentifiedMagistratDto> {
    // Two rows tell an address held by several magistrats, which identifies none of them
    const [magistrat, homonym] = await this.db.tx.magistrat.findMany({
      where: { professionalEmail: { equals: query.email, mode: 'insensitive' }, status: 'ACTIVE' },
      select: { id: true } satisfies Prisma.MagistratSelect,
      take: 2,
    });

    return magistrat && !homonym
      ? { status: 'ACTIVE', magistrat: { id: magistrat.id } }
      : { status: 'UNKNOWN' };
  }
}

export class IdentifyMagistratDto extends createZodDto(z.object({ email: z.email() })) {}

export class IdentifiedMagistratDto extends createZodDto(
  z.object({
    status: z.enum(['ACTIVE', 'UNKNOWN']).meta({
      description:
        '- `ACTIVE`: the address is the professional one of a single active _Magistrat_\n' +
        '- `UNKNOWN`: unknown address, inactive _Magistrat_ or address held by several of them, never told apart',
    }),
    magistrat: z
      .object({
        id: z.uuid().meta({ description: 'The Fondation identifier, to read the status again later' }),
      })
      .optional()
      .meta({ description: 'Given with `ACTIVE` only' }),
  }),
) {}
