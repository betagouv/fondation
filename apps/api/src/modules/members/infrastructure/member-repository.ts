import { Injectable, NotFoundException } from '@nestjs/common';
import { Db, Tx } from 'src/modules/framework/drizzle';
import { ExcludedMemberJurisdictions, Member } from '../domain/member';
import { MEMBER_ROLES } from './member.utils';
import { drizzleExcludedJurisdictions } from 'src/modules/framework/drizzle/schemas';
import { eq } from 'drizzle-orm';
import { makeId } from 'src/utils/id';

@Injectable()
export class MemberRepository {
  constructor(private readonly db: Db) {}

  async findWithJurisdictions(props: {
    userId: string;
    jurisdictionIds: readonly string[];
  }): Promise<Member> {
    return this.db.transaction(async (tx) => {
      const user = await tx.query.users.findFirst({
        columns: { id: true },
        where: (u, { and, eq, inArray }) =>
          and(eq(u.id, props.userId), inArray(u.role, MEMBER_ROLES)),
      });

      if (!user) throw new NotFoundException({ userId: props.userId });

      if (props.jurisdictionIds.length === 0) {
        return Member.from({ id: user.id, jurisdictionIds: new Set() });
      }

      const jurisdictions = await tx.query.drizzleJurisdiction.findMany({
        columns: { codejur: true },
        where: (j, { inArray }) =>
          inArray(j.codejur, props.jurisdictionIds as string[]),
      });

      return Member.from({
        id: user.id,
        jurisdictionIds: new Set(
          jurisdictions.map(({ codejur }) => makeId('JurisdictionId', codejur)),
        ),
      });
    });
  }

  persist(member: Member) {
    return this.db.transaction((tx) => {
      return Promise.all(
        member.messages.map((message) => {
          if (message instanceof ExcludedMemberJurisdictions) {
            return this.persistExcludedMemberJurisdictions(tx, message);
          }
        }),
      );
    });
  }

  private async persistExcludedMemberJurisdictions(
    tx: Tx,
    message: ExcludedMemberJurisdictions,
  ) {
    await tx
      .delete(drizzleExcludedJurisdictions)
      .where(eq(drizzleExcludedJurisdictions.userId, message.userId));

    await tx.insert(drizzleExcludedJurisdictions).values(
      message.jurisdictionIds.map((jurisdictionId) => ({
        userId: message.userId,
        jurisdictionId,
      })),
    );
  }
}
