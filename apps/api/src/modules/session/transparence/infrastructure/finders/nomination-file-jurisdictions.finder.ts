import { Injectable } from '@nestjs/common';

import { Prisma } from 'src/generated/prisma/client';
import { findNominationFileJurisdictionsRawQuery } from 'src/generated/prisma/sql';
import { PrismaService } from 'src/modules/framework/database';

export type NominationFileJurisdiction = { id: string; label: string | null };

export type NominationFileJurisdictions = {
  current: NominationFileJurisdiction | null;
  targeted: NominationFileJurisdiction | null;
};

@Injectable()
export class NominationFileJurisdictionsFinder {
  constructor(private readonly prisma: PrismaService) {}

  async find(predicate: {
    tx?: Prisma.TransactionClient;
    nominationFileIds: readonly string[];
  }): Promise<Map<string, NominationFileJurisdictions>> {
    if (!predicate.tx) return this.prisma.$transaction((tx) => this.find({ ...predicate, tx }));
    if (predicate.nominationFileIds.length === 0) return new Map();

    const rows = await predicate.tx.$queryRawTyped(
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
