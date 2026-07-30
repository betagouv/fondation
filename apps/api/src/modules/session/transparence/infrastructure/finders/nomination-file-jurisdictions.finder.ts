import { Injectable } from '@nestjs/common';

import { Prisma } from 'src/generated/prisma/client';
import { PrismaService } from 'src/modules/framework/database';

export type NominationFileJurisdictions = { current: string | null; targeted: string | null };

type NominationFilePositions = {
  id: string;
  currentPosition: string | null;
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

    const positions = predicate.files.map(({ id, currentPosition, targetedPosition }) => ({
      id,
      currentPosition,
      targetedPosition,
    }));

    const rows = await predicate.tx.$queryRaw<
      { id: string; current: string | null; target: string | null }[]
    >`
      WITH queried_positions AS (
        SELECT
          (p.content ->> 'id')::UUID AS id,
          (p.content ->> 'currentPosition') AS current_position,
          (p.content ->> 'targetedPosition') AS targeted_position
        FROM UNNEST (${positions}::jsonb[]) AS p(content)
      )

      SELECT queried_positions.id, current_j.codejur AS "current", target_j.codejur AS "target"
      FROM queried_positions
        LEFT JOIN data_administration_context.jurisdictions current_j
          ON (
            queried_positions.current_position IS NOT NULL
            AND queried_positions.current_position ILIKE '%' || current_j.codejur || '%'
          )
        LEFT JOIN data_administration_context.jurisdictions target_j
          ON (
            queried_positions.targeted_position IS NOT NULL
            AND queried_positions.targeted_position ILIKE '%' || target_j.codejur || '%'
          )
    `;

    return new Map(rows.map(({ id, current, target }) => [id, { current, targeted: target }]));
  }
}
