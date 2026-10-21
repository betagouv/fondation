import type { RoleEnum } from 'src/modules/shared/role.enum';
import type { UserDutyEnum } from 'src/modules/shared/user-duty.enum';
import type { UserTitleEnum } from 'src/modules/shared/user-title.enum';
import { assertNever } from 'src/utils/assert-never';

export const ADMIN_USER_ROLES_ENUM = [
  'FIRST_SECRETARY',
  'SECRETARY',
  'OFFICER',

  'PRESIDENT_SIEGE',
  'DEPUTY_PRESIDENT_SIEGE',
  'PRESIDENT_PARQUET',
  'DEPUTY_PRESIDENT_PARQUET',

  'MEMBRE_PARQUET',
  'MEMBRE_SIEGE',
  'MEMBRE_COMMUN',
] as const;
export type AdminUserRoleEnum = (typeof ADMIN_USER_ROLES_ENUM)[number];

export function adminUserRoleEnumToTitle(role: AdminUserRoleEnum): UserTitleEnum | null {
  switch (role) {
    case 'DEPUTY_PRESIDENT_PARQUET':
      return 'DEPUTY_PRESIDENT_PARQUET';
    case 'DEPUTY_PRESIDENT_SIEGE':
      return 'DEPUTY_PRESIDENT_SIEGE';

    case 'PRESIDENT_PARQUET':
      return 'PRESIDENT_PARQUET';
    case 'PRESIDENT_SIEGE':
      return 'PRESIDENT_SIEGE';

    case 'FIRST_SECRETARY':
      return 'FIRST_SECRETARY';

    case 'MEMBRE_COMMUN':
    case 'MEMBRE_PARQUET':
    case 'MEMBRE_SIEGE':
    case 'OFFICER':
    case 'SECRETARY':
      return null;

    default:
      return assertNever(role);
  }
}

export function adminUserRoleEnumToDuty(role: AdminUserRoleEnum): UserDutyEnum | null {
  switch (role) {
    case 'DEPUTY_PRESIDENT_PARQUET':
    case 'DEPUTY_PRESIDENT_SIEGE':
      return 'DEPUTY_PRESIDENT';

    case 'PRESIDENT_PARQUET':
    case 'PRESIDENT_SIEGE':
      return 'PRESIDENT';

    case 'FIRST_SECRETARY':
    case 'SECRETARY':
      return 'SECRETARY';

    case 'OFFICER':
      return 'OFFICER';

    case 'MEMBRE_COMMUN':
    case 'MEMBRE_PARQUET':
    case 'MEMBRE_SIEGE':
      return null;

    default:
      return assertNever(role);
  }
}

export function adminUserRoleEnumToIdentityRoles(role: AdminUserRoleEnum): RoleEnum[] {
  switch (role) {
    case 'DEPUTY_PRESIDENT_PARQUET':
    case 'PRESIDENT_PARQUET':
      return ['MEMBRE_COMMUN', 'MEMBRE_DU_PARQUET'];

    case 'DEPUTY_PRESIDENT_SIEGE':
    case 'PRESIDENT_SIEGE':
      return ['MEMBRE_COMMUN', 'MEMBRE_DU_SIEGE'];

    case 'MEMBRE_PARQUET':
      return ['MEMBRE_DU_PARQUET'];

    case 'MEMBRE_SIEGE':
      return ['MEMBRE_DU_SIEGE'];

    case 'MEMBRE_COMMUN':
      return ['MEMBRE_COMMUN'];

    case 'FIRST_SECRETARY':
    case 'SECRETARY':
    case 'OFFICER':
      return ['ADMIN', 'ADJOINT_SECRETAIRE_GENERAL'];

    default:
      return assertNever(role);
  }
}
