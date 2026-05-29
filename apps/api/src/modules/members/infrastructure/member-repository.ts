import { Injectable, NotFoundException } from '@nestjs/common';

import {
  ExcludedMemberJurisdictions,
  Member,
  MemberDisplayTitleUpdated,
  MemberTitleUpdated,
} from '../domain/member';
import { Prisma } from 'src/generated/prisma/client';
import { PrismaService } from 'src/modules/framework/database';
import { prismaRoleEnumToRoleEnum } from 'src/modules/shared/mappers/role-enum.mapper';
import { assertNever } from 'src/utils/assert-never';
import { makeId } from 'src/utils/id';

import { MEMBER_ROLES } from './member.utils';

@Injectable()
export class MemberRepository {
  constructor(private readonly prisma: PrismaService) {}

  async find(userId: string, options: { tx?: Prisma.TransactionClient } = {}): Promise<Member> {
    if (!options?.tx) {
      return this.prisma.$transaction((tx) => this.find(userId, { tx }));
    }

    const { tx } = options;
    const user = await tx.user.findFirst({
      select: { id: true, role: true },
      where: { id: userId, role: { in: MEMBER_ROLES } },
    });

    if (!user) throw new NotFoundException({ userId });

    return Member.from({
      id: user.id,
      role: prismaRoleEnumToRoleEnum(user.role),
      jurisdictionIds: new Set(),
    });
  }

  async findWithJurisdictions(props: {
    userId: string;
    jurisdictionIds: readonly string[];
  }): Promise<Member> {
    return this.prisma.$transaction(async (tx) => {
      const member = await this.find(props.userId, { tx });

      if (props.jurisdictionIds.length === 0) return member;

      const jurisdictions = await tx.jurisdiction.findMany({
        select: { codejur: true },
        where: { codejur: { in: props.jurisdictionIds as string[] } },
      });

      return Member.from({
        id: member.id,
        role: member.role,
        jurisdictionIds: new Set(jurisdictions.map(({ codejur }) => makeId('JurisdictionId', codejur))),
      });
    });
  }

  async persist(member: Member): Promise<void> {
    await this.prisma.$transaction(
      member.messages.flatMap((message) => {
        if (message instanceof ExcludedMemberJurisdictions)
          return this.persistExcludedMemberJurisdictions(message);

        if (message instanceof MemberDisplayTitleUpdated)
          return this.persistMemberDisplayTitleUpdated(message);

        if (message instanceof MemberTitleUpdated) return this.persistMemberTitleUpdated(message);

        return assertNever(message);
      }),
    );
  }

  private persistExcludedMemberJurisdictions(message: ExcludedMemberJurisdictions) {
    return this.prisma.user.update({
      where: { id: message.userId },
      data: {
        excludedJurisdictionIds: {
          deleteMany: {},

          createMany: {
            skipDuplicates: true,
            data: message.jurisdictionIds.map((jurisdictionId) => ({
              jurisdictionId,
            })),
          },
        },
      },
    });
  }

  private persistMemberDisplayTitleUpdated(message: MemberDisplayTitleUpdated) {
    return this.prisma.user.update({
      where: { id: message.userId },
      data: { displayTitle: message.displayTitle },
    });
  }

  private persistMemberTitleUpdated(message: MemberTitleUpdated) {
    return [
      this.prisma.user.updateMany({
        where: { title: message.title },
        data: { title: null, duty: null },
      }),

      this.prisma.user.update({
        where: { id: message.userId },
        data: { title: message.title, duty: message.duty },
      }),
    ];
  }
}
