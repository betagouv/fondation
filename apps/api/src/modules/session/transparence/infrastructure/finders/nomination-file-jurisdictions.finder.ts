import { Injectable } from '@nestjs/common';

import { Prisma } from 'src/generated/prisma/client';
import { findNominationFileJurisdictionsRawQuery } from 'src/generated/prisma/sql';
import { PrismaService } from 'src/modules/framework/database';

export type NominationFileJurisdiction = { id: string; label: string | null };

export type NominationFileJurisdictions = {
  current: NominationFileJurisdiction | null;
  targeted: NominationFileJurisdiction | null;
};

type NominationFilePositions = {
  id: string;
  currentPosition: string | null;
  detectedJurisdictionId: string | null;
  targetedPosition: string | null;
};

@Injectable()
export class NominationFileJurisdictionsFinder {
  constructor(private readonly prisma: PrismaService) {}

  async find(predicate: {
    tx?: Prisma.TransactionClient;
    files: readonly NominationFilePositions[];
  }): Promise<Map<string, NominationFileJurisdictions>> {
    if (!predicate.tx) return this.prisma.$transaction((tx) => this.find({ ...predicate, tx }));
    if (predicate.files.length === 0) return new Map();

    const { files, tx } = predicate;

    // LOLFI resolves the targeted jurisdiction at ingestion but carries the current position as a
    // free label. An empty position never matches, skipping the text fallback where the id is known.
    const matched = await tx.$queryRawTyped(
      findNominationFileJurisdictionsRawQuery(
        files.map(({ id }) => id),
        files.map(({ currentPosition }) => currentPosition ?? ''),
        files.map(({ detectedJurisdictionId, targetedPosition }) =>
          detectedJurisdictionId ? '' : (targetedPosition ?? ''),
        ),
      ),
    );
    const matchedById = new Map(matched.map((row) => [row.id, row]));

    const detectedIds = files
      .map(({ detectedJurisdictionId }) => detectedJurisdictionId)
      .filter((id): id is string => !!id);
    const detectedJurisdictions = detectedIds.length
      ? await tx.jurisdiction.findMany({
          select: { codejur: true, libelle: true },
          where: { codejur: { in: detectedIds } },
        })
      : [];
    const detectedLabelById = new Map(detectedJurisdictions.map((j) => [j.codejur, j.libelle]));

    return new Map(
      files.map((file) => {
        const row = matchedById.get(file.id);
        const current = row?.currentJurisdictionId
          ? { id: row.currentJurisdictionId, label: row.currentJurisdictionLabel }
          : null;
        const targeted = file.detectedJurisdictionId
          ? {
              id: file.detectedJurisdictionId,
              label: detectedLabelById.get(file.detectedJurisdictionId) ?? null,
            }
          : row?.targetedJurisdictionId
            ? { id: row.targetedJurisdictionId, label: row.targetedJurisdictionLabel }
            : null;

        return [file.id, { current, targeted }];
      }),
    );
  }
}
