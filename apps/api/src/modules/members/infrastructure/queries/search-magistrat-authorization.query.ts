import { Injectable } from '@nestjs/common';
import { createZodDto } from 'nestjs-zod';
import z from 'zod';

import { findActiveMagistratIdsByEmailRawQuery } from '../../../../generated/prisma/sql';
import { Db } from '../../../framework/database';

@Injectable()
export class SearchMagistratAuthorizationQuery {
  constructor(private readonly db: Db) {}

  async handle(query: { email: string }): Promise<FoundMagistratAuthorizationDto> {
    const [magistrat] = await this.db.tx.$queryRawTyped(findActiveMagistratIdsByEmailRawQuery(query.email));

    return {
      role: magistrat ? 'MAGISTRAT' : 'UNKNOWN',
    };
  }
}

export class FoundMagistratAuthorizationDto extends createZodDto(
  z.object({
    role: z.enum(['MAGISTRAT', 'UNKNOWN']).meta({
      description:
        '- `MAGISTRAT` means that the email exists and refers to an active _Magistrat_\n' +
        '- `UNKNOWN` we did not find any active _Magistrat_ with that email',
    }),
  }),
) {}
