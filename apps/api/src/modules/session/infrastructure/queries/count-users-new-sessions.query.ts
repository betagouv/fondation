import { Injectable } from '@nestjs/common';
import { createZodDto } from 'nestjs-zod';
import z from 'zod';

import { PrismaService } from 'src/modules/framework/database';

@Injectable()
export class CountUsersNewSessionsQuery {
  constructor(private readonly prisma: PrismaService) {}

  async handle(): Promise<CountUsersNewSessionsDto> {
    const count = await this.prisma.session.count({
      where: { isValidated: false },
    });

    return { count };
  }
}

export class CountUsersNewSessionsDto extends createZodDto(
  z.object({ count: z.number() }),
) {}
