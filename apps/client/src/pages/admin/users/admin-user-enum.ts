import { RoleEnumLabels, type RoleEnum } from '@/types/enums.types';
import type { DetailedAdminUserDto } from '@api/types';

export type UserTitleEnum = DetailedAdminUserDto['title'];
export type UserDutyEnum = DetailedAdminUserDto['duty'];

export const UserTitleEnumLabels = {
  PRESIDENT_SIEGE: 'Président du Siège',
  PRESIDENT_PARQUET: 'Président du Parquet',
  FIRST_SECRETARY: 'Secrétaire Général'
} as const satisfies Record<UserTitleEnum, string>;

export const USER_TITLE_ENUM_OPTIONS: { id: UserTitleEnum; label: string }[] = Object.entries(
  UserTitleEnumLabels
).map(([id, label]) => ({ id: id as UserTitleEnum, label }));

export const UserDutyEnumLabels = {
  PRESIDENT: 'Président',
  SECRETARY: 'Secrétaire',
  OFFICER: 'Agent'
} as const satisfies Record<UserDutyEnum, string>;

export const USER_DUTY_ENUM_OPTIONS: { id: UserDutyEnum; label: string }[] = Object.entries(
  UserDutyEnumLabels
).map(([id, label]) => ({
  id: id as UserDutyEnum,
  label
}));

export const ROLE_OPTIONS: { id: RoleEnum; label: string }[] = Object.entries(RoleEnumLabels).map(
  ([id, label]) => ({ id: id as RoleEnum, label })
);
