import { Propagation, Transactional } from '@nestjs-cls/transactional';
import { Injectable, NotFoundException } from '@nestjs/common';

import { Prisma } from '../../../generated/prisma/client';
import { assertNever } from '../../../utils/assert-never';
import { makeId } from '../../../utils/id';
import { Db } from '../../framework/database';
import { prismaRoleEnumToRoleEnum } from '../../shared/mappers/role-enum.mapper';
import { MEMBER_ROLES } from '../../shared/role.enum';
import {
  ExcludedMemberJurisdictions,
  Member,
  MemberDisplayTitleUpdated,
  MemberMagistratsExcluded,
} from '../domain/member';

@Injectable()
export class MemberRepository {
  constructor(private readonly db: Db) {}

  @Transactional()
  async find(userId: string): Promise<Member> {
    const user = await this.db.tx.user.findFirst({
      select: { id: true, role: true } satisfies Prisma.UserSelect,
      where: { id: userId, role: { in: MEMBER_ROLES } },
    });

    if (!user) throw new NotFoundException({ userId });

    return Member.from({
      id: user.id,
      role: prismaRoleEnumToRoleEnum(user.role),
      jurisdictionIds: new Set(),
    });
  }

  @Transactional()
  async findWithJurisdictions(props: {
    userId: string;
    jurisdictionIds: readonly string[];
  }): Promise<Member> {
    const member = await this.find(props.userId);

    if (props.jurisdictionIds.length === 0) return member;

    const jurisdictions = await this.db.tx.jurisdiction.findMany({
      select: { codejur: true } satisfies Prisma.JurisdictionSelect,
      where: { codejur: { in: props.jurisdictionIds as string[] } },
    });

    return Member.from({
      id: member.id,
      role: member.role,
      jurisdictionIds: new Set(jurisdictions.map(({ codejur }) => makeId('JurisdictionId', codejur))),
    });
  }

  @Transactional(Propagation.Mandatory)
  async persist(member: Member): Promise<void> {
    for (const message of member.messages) {
      if (message instanceof ExcludedMemberJurisdictions)
        await this.persistExcludedMemberJurisdictions(message);
      else if (message instanceof MemberDisplayTitleUpdated)
        await this.persistMemberDisplayTitleUpdated(message);
      else if (message instanceof MemberMagistratsExcluded)
        await this.persistMemberMagistratsExcluded(message);
      else assertNever(message);
    }
  }

  @Transactional()
  async findKnownMagistratIds(magistratIds: readonly string[]): Promise<Set<string>> {
    if (magistratIds.length === 0) return new Set();

    const magistrats = await this.db.tx.magistrat.findMany({
      select: { id: true } satisfies Prisma.MagistratSelect,
      where: { id: { in: [...magistratIds] } },
    });
    return new Set(magistrats.map(({ id }) => id));
  }

  private async persistMemberMagistratsExcluded(message: MemberMagistratsExcluded) {
    await this.db.tx.excludedMagistrat.deleteMany({ where: { userId: message.userId } });
    await this.db.tx.excludedMagistrat.createMany({
      data: message.magistratIds.map((magistratId) => ({ magistratId, userId: message.userId })),
    });
  }

  private persistExcludedMemberJurisdictions(message: ExcludedMemberJurisdictions) {
    return this.db.tx.user.update({
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
    return this.db.tx.user.update({
      where: { id: message.userId },
      data: { displayTitle: message.displayTitle },
    });
  }
}
