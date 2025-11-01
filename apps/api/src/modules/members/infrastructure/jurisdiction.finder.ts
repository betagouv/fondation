import { Injectable, NotFoundException } from '@nestjs/common';
import { JurisdictionId } from '../domain/jurisdiction';
import { Db } from 'src/modules/framework/drizzle';

@Injectable()
export class JurisdictionFinder {
  constructor(private readonly db: Db) {}

  async findMany(props: {
    jurisdictionIds: readonly string[];
  }): Promise<JurisdictionId[]> {
    const uniqueJurisdictionIds = Array.from(new Set(props.jurisdictionIds));
    const jurisdictions = await this.db.query.drizzleJurisdiction.findMany({
      columns: { codejur: true },
      where: (j, { inArray }) => inArray(j.codejur, uniqueJurisdictionIds),
    });

    if (jurisdictions.length !== uniqueJurisdictionIds.length) {
      throw new NotFoundException();
    }

    return jurisdictions.map(({ codejur }) => codejur as JurisdictionId);
  }
}
