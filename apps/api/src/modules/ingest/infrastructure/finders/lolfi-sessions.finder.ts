import { Inject, Injectable } from '@nestjs/common';

import { ReceivedDesignations } from '../../domain/incomplete-transparence';
import { countLolfiSessionDesignations } from 'src/generated/prisma/sql';
import { API_CONFIG_TOKEN, ApiConfig } from 'src/modules/framework/config';
import { Db } from 'src/modules/framework/database';
import { DateOnly } from 'src/utils/date-only';

const FIRST_SYNCHRONISED_PUBLICATION = new Date(Date.UTC(2026, 5, 1));

export type LolfiSessionToSynchronise = {
  id: number;
  name: string | null;
  creationDate: DateOnly;
};

@Injectable()
export class LolfiSessionsFinder {
  private readonly publishedFrom: Date | undefined;

  constructor(
    private readonly db: Db,
    @Inject(API_CONFIG_TOKEN) config: ApiConfig,
  ) {
    this.publishedFrom = config.isProduction ? FIRST_SYNCHRONISED_PUBLICATION : undefined;
  }

  async find(): Promise<LolfiSessionToSynchronise[]> {
    const sessions = await this.db.tx.lolfiSession.findMany({
      where: this.publishedFrom ? { createdAt: { gte: this.publishedFrom } } : undefined,
      select: { id: true, label: true, createdAt: true },
    });

    return sessions.map(({ id, label, createdAt }) => ({
      id,
      name: label,
      creationDate: DateOnly.fromUtcDate(createdAt),
    }));
  }

  async findDesignations(sessionIds: readonly number[]): Promise<Map<number, ReceivedDesignations>> {
    const sessions = await this.db.tx.$queryRawTyped(countLolfiSessionDesignations([...sessionIds]));

    return new Map(
      sessions.map(({ sessionId, candidatures, siege, parquet }) => [
        sessionId,
        {
          candidatures: candidatures ?? 0,
          perFormation: { SIEGE: siege ?? 0, PARQUET: parquet ?? 0 },
        },
      ]),
    );
  }
}
