import { Injectable } from '@nestjs/common';

import { Db } from '../../../../framework/database';
import type { RoleEnum } from '../../../../shared/role.enum';
import type { CountedSessionAuditionsDto } from '../dtos/session-audition.dto';
import { SessionAuditionsFinder } from '../finders/session-auditions.finder';

@Injectable()
export class CountSessionAuditionsQuery {
  constructor(
    private readonly db: Db,
    private readonly sessionAuditions: SessionAuditionsFinder,
  ) {}

  async handle(query: { role: RoleEnum; sessionId: string }): Promise<CountedSessionAuditionsDto> {
    const auditions = await this.db.withTransaction(() => this.sessionAuditions.find(query));
    const scheduled = auditions.filter((audition) => audition.audition).length;

    return { scheduled, toSchedule: auditions.length - scheduled };
  }
}
