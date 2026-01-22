import { Injectable } from '@nestjs/common';
import { createZodDto } from 'nestjs-zod';
import z from 'zod';

import { UnaffectedFilesFinder } from '../finders/unaffected-files.finder';

@Injectable()
export class CountUnaffectedFilesQuery {
  constructor(private readonly unaffectedFilesFinder: UnaffectedFilesFinder) {}

  async handle(query: {
    sessionId: string;
    nominationFileIds: readonly string[] | undefined;
  }): Promise<CountedUnaffectedFilesDto> {
    const { items } = await this.unaffectedFilesFinder.find({
      sessionId: query.sessionId,
      nominationFileIds: query.nominationFileIds,
    });

    return { count: items.length };
  }
}

export class CountedUnaffectedFilesDto extends createZodDto(
  z.object({ count: z.number() }),
) {}
