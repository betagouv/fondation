import { Injectable } from '@nestjs/common';

import type { CountedSessionAuditionsDto } from '../dtos/session-audition.dto';
import { SessionAuditionsFinder } from '../finders/session-auditions.finder';
import { Db } from 'src/modules/framework/database';

@Injectable()
export class CountSessionAuditionsQuery {
  constructor(
    private readonly db: Db,
    private readonly sessionAuditions: SessionAuditionsFinder,
  ) {}

  async handle(query: { sessionId: string }): Promise<CountedSessionAuditionsDto> {
    const auditions = await this.db.withTransaction(() => this.sessionAuditions.find(query));
    const scheduled = auditions.filter((audition) => audition.audition).length;

    return { scheduled, toSchedule: auditions.length - scheduled };
  }
}
