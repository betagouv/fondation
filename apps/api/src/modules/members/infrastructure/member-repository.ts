import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from 'src/generated/prisma/client';
import { PrismaService } from 'src/modules/framework/database';
import { makeId } from 'src/utils/id';
import { ExcludedMemberJurisdictions, Member } from '../domain/member';
import { MEMBER_ROLES } from './member.utils';

@Injectable()
export class MemberRepository {
  constructor(private readonly db: PrismaService) {}

  async findWithJurisdictions(props: {
    userId: string;
    jurisdictionIds: readonly string[];
  }): Promise<Member> {
    return this.db.$transaction(async (tx) => {
      const user = await tx.user.findFirst({
        select: { id: true },
        where: { id: props.userId, role: { in: MEMBER_ROLES } },
      });

      if (!user) throw new NotFoundException({ userId: props.userId });

      if (props.jurisdictionIds.length === 0) {
        return Member.from({ id: user.id, jurisdictionIds: new Set() });
      }

      const jurisdictions = await tx.jurisdiction.findMany({
        select: { codejur: true },
        where: { codejur: { in: props.jurisdictionIds as string[] } },
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
    return this.db.$transaction((tx) => {
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
    tx: Prisma.TransactionClient,
    message: ExcludedMemberJurisdictions,
  ) {
    await tx.excludedJurisdiction.deleteMany({
      where: { userId: message.userId },
    });

    await tx.excludedJurisdiction.createMany({
      data: message.jurisdictionIds.map((jurisdictionId) => ({
        userId: message.userId,
        jurisdictionId,
      })),
    });
  }
}
