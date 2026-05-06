import { PrismaUserTitleEnum } from 'src/generated/prisma/enums';

export const MEMBER_TITLES = ['PRESIDENT_SIEGE', 'PRESIDENT_PARQUET'] as const;
export type MemberTitleEnum = (typeof MEMBER_TITLES)[number];

export function toMemberTitle(value: PrismaUserTitleEnum | null): MemberTitleEnum | null {
  return MEMBER_TITLES.includes(value as any) ? (value as MemberTitleEnum) : null;
}

export const MEMBER_DUTIES = ['PRESIDENT'] as const;
export type MemberDutyEnum = (typeof MEMBER_DUTIES)[number];
