import { Injectable } from '@nestjs/common';

import { formationToMemberRole } from '../../../shared/formation-to-member-role';
import { Db } from 'src/modules/framework/database';
import { FormationEnum } from 'src/modules/shared/formation.enum';

@Injectable()
export class InternalFindMembersByFullNameQuery {
  constructor(private readonly db: Db) {}

  async handle(query: {
    formation: FormationEnum | undefined;
    fullNames: readonly string[];
  }): Promise<FoundMemberByFullName[]> {
    const roles = formationToMemberRole(query.formation);

    const queriedFullNames = new Map<string, string>(query.fullNames.map((x) => [x.trim().toLowerCase(), x]));

    const reporterFullNames = Array.from(queriedFullNames.keys());

    // TypedSQL does not support array variables
    const members = await this.db.tx.$queryRaw<FoundMemberByFullName[]>`
      SELECT
        id,
        LOWER(last_name || ' ' || first_name) AS "fullName",
        last_name AS "lastName",
        first_name AS "firstName"
      FROM identity_and_access_context.users
      WHERE (
        LOWER(last_name || ' ' || first_name) = ANY(${reporterFullNames}::TEXT[])
        AND "role" = ANY(${roles})
      );
    `;

    return members.map((member) => {
      const queriedFullName = queriedFullNames.get(member.fullName);
      return { ...member, fullName: queriedFullName ?? member.fullName };
    });
  }
}

type FoundMemberByFullName = {
  id: string;
  fullName: string;
  firstName: string;
  lastName: string;
};
