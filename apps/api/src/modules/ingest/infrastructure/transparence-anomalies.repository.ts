import { Injectable } from '@nestjs/common';

import { Db } from 'src/modules/framework/database';

@Injectable()
export class TransparenceAnomaliesRepository {
  constructor(private readonly db: Db) {}

  async findAlerted(lolfiSessionIds: readonly number[]): Promise<Map<number, string>> {
    const anomalies = await this.db.tx.lolfiTransparenceAnomaly.findMany({
      where: { lolfiSessionId: { in: [...lolfiSessionIds] } },
      select: { lolfiSessionId: true, reason: true },
    });

    return new Map(anomalies.map(({ lolfiSessionId, reason }) => [lolfiSessionId, reason]));
  }

  async recordAlert(anomaly: { lolfiSessionId: number; reason: string; alertedAt: Date }): Promise<void> {
    const { lolfiSessionId, ...alert } = anomaly;

    await this.db.tx.lolfiTransparenceAnomaly.upsert({
      where: { lolfiSessionId },
      create: anomaly,
      update: alert,
    });
  }

  async forget(lolfiSessionIds: readonly number[]): Promise<void> {
    await this.db.tx.lolfiTransparenceAnomaly.deleteMany({
      where: { lolfiSessionId: { in: [...lolfiSessionIds] } },
    });
  }
}
