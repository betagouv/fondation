import { Transactional } from '@nestjs-cls/transactional';
import { Injectable } from '@nestjs/common';

import { findNominationFileJurisdictionsRawQuery } from 'src/generated/prisma/sql';
import { Db } from 'src/modules/framework/database';

export type NominationFileJurisdiction = { id: string; label: string | null };

export type NominationFileJurisdictions = {
  current: NominationFileJurisdiction | null;
  targeted: NominationFileJurisdiction | null;
};

@Injectable()
export class NominationFileJurisdictionsFinder {
  constructor(private readonly db: Db) {}

  @Transactional()
  async find(predicate: {
    nominationFileIds: readonly string[];
  }): Promise<Map<string, NominationFileJurisdictions>> {
    if (predicate.nominationFileIds.length === 0) return new Map();

    const rows = await this.db.tx.$queryRawTyped(
      findNominationFileJurisdictionsRawQuery(predicate.nominationFileIds as string[]),
    );

    return new Map(
      rows.map((row) => [
        row.id,
        {
          current: row.currentJurisdictionId
            ? { id: row.currentJurisdictionId, label: row.currentJurisdictionLabel }
            : null,
          targeted: row.targetedJurisdictionId
            ? { id: row.targetedJurisdictionId, label: row.targetedJurisdictionLabel }
            : null,
        },
      ]),
    );
  }
}
