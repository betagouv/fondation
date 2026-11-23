import { Injectable } from '@nestjs/common';
import { createZodDto } from 'nestjs-zod';
import z from 'zod';

import { findActiveMagistratIdsByEmailRawQuery } from '../../../../generated/prisma/sql';
import { Db } from '../../../framework/database';

@Injectable()
export class IdentifyMagistratQuery {
  constructor(private readonly db: Db) {}

  async handle(query: { email: string }): Promise<IdentifiedMagistratDto> {
    // Two rows tell an address held by several magistrats, which identifies none of them
    const [magistrat, homonym] = await this.db.tx.$queryRawTyped(
      findActiveMagistratIdsByEmailRawQuery(query.email),
    );

    return magistrat && !homonym
      ? { status: 'ACTIVE', magistrat: { id: magistrat.id } }
      : { status: 'UNKNOWN' };
  }
}

export class IdentifyMagistratDto extends createZodDto(z.object({ email: z.email() })) {}

const identifiedMagistratSchema = z
  .discriminatedUnion('status', [
    z.object({
      status: z.literal('ACTIVE').meta({
        description: 'The address is the professional one of a single active _Magistrat_',
      }),
      magistrat: z.object({
        id: z.uuid().meta({ description: 'The Fondation identifier, to read the status again later' }),
      }),
    }),
    z.object({
      status: z.literal('UNKNOWN').meta({
        description:
          'Unknown address, inactive _Magistrat_ or address held by several of them, never told apart',
      }),
    }),
  ])
  .meta({ id: 'IdentifiedMagistratDto' });

// A union has no members known statically: TypeScript refuses it as a base class (TS2509)
export type IdentifiedMagistratDto = z.infer<typeof identifiedMagistratSchema>;
export const IdentifiedMagistratDto = createZodDto(identifiedMagistratSchema);
