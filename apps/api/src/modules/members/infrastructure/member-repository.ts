import { Injectable, NotFoundException } from '@nestjs/common';
import { Db, Tx } from 'src/modules/framework/drizzle';
import { ExcludedMemberJurisdictions, Member } from '../domain/member';
import { MEMBER_ROLES } from './member.utils';
import { drizzleMemberRule } from 'src/modules/framework/drizzle/schemas';
import { eq } from 'drizzle-orm';

@Injectable()
export class MemberRepository {
  constructor(private readonly db: Db) {}

  async find(id: string): Promise<Member> {
    const user = await this.db.query.users.findFirst({
      columns: { id: true },
      where: (u, { and, eq, inArray }) =>
        and(eq(u.id, id), inArray(u.role, MEMBER_ROLES)),
    });

    if (!user) throw new NotFoundException();
    return Member.from({ id });
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
      .delete(drizzleMemberRule)
      .where(eq(drizzleMemberRule.userId, message.userId));

    await tx.insert(drizzleMemberRule).values(
      message.jurisdictionIds.map((excludedJurisdiction) => ({
        userId: message.userId,
        excludedJurisdiction,
      })),
    );
  }
}
