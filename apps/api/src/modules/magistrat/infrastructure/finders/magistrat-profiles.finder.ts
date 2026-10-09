import { Injectable } from '@nestjs/common';

import { magistratFullName } from '../../domain/magistrat-name';
import { findMagistratProfilesRawQuery } from 'src/generated/prisma/sql';
import { Db } from 'src/modules/framework/database';

export type MagistratProfile = {
  currentPosition: string | null;
  email: string | null;
  name: string;
  phoneNumber: { label: string | null; number: string } | null;
};

@Injectable()
export class MagistratProfilesFinder {
  constructor(private readonly db: Db) {}

  async findByMagistratId(query: {
    magistratIds: readonly string[];
  }): Promise<Map<string, MagistratProfile>> {
    if (!query.magistratIds.length) return new Map();

    const magistrats = await this.db.tx.$queryRawTyped(
      findMagistratProfilesRawQuery([...query.magistratIds]),
    );

    return new Map(
      magistrats.map((magistrat) => {
        const position = [magistrat.functionLabel, magistrat.jurisdictionId?.replace(/\s+/g, ' ')]
          .filter(Boolean)
          .join(' ');
        return [
          magistrat.magistratId,
          {
            currentPosition: [magistrat.grade, position].filter(Boolean).join(' - ') || null,
            email: magistrat.email?.toLowerCase() ?? null,
            name: magistratFullName(magistrat),
            phoneNumber: magistrat.phone ? { label: magistrat.phoneLabel, number: magistrat.phone } : null,
          },
        ];
      }),
    );
  }
}
