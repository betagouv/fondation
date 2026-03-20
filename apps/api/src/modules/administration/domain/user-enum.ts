import {
  PrismaUserDutyEnum,
  PrismaUserTitleEnum,
} from 'src/generated/prisma/enums';

export const USER_TITLES = [
  'PRESIDENT_SIEGE',
  'PRESIDENT_PARQUET',
  'FIRST_SECRETARY',
] as const;
export type UserTitle = (typeof USER_TITLES)[number];

export const USER_DUTIES = ['PRESIDENT', 'SECRETARY', 'OFFICER'] as const;
export type UserDuty = (typeof USER_DUTIES)[number];

export function toUserTitle(
  value: PrismaUserTitleEnum | null,
): UserTitle | null {
  return USER_TITLES.includes(value as UserTitle) ? (value as UserTitle) : null;
}

export function toUserDuty(value: PrismaUserDutyEnum | null): UserDuty | null {
  return USER_DUTIES.includes(value as UserDuty) ? (value as UserDuty) : null;
}
