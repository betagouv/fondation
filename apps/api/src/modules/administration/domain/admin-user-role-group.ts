import type { AdminUserRoleEnum } from '../../shared/admin-user-role.enum';

export const ADMIN_USER_ROLE_GROUPS = ['PRESIDENCY', 'MEMBER', 'SECRETARIAT'] as const;
export type AdminUserRoleGroup = (typeof ADMIN_USER_ROLE_GROUPS)[number];

export const adminUserRoleGroupLabel = {
  MEMBER: 'Membre',
  PRESIDENCY: 'Présidents / Suppléants',
  SECRETARIAT: 'Secrétariat général',
} as const satisfies Record<AdminUserRoleGroup, string>;

const GROUP_OF_ROLE = {
  DEPUTY_PRESIDENT_PARQUET: 'PRESIDENCY',
  DEPUTY_PRESIDENT_SIEGE: 'PRESIDENCY',
  FIRST_SECRETARY: 'SECRETARIAT',
  MEMBRE_COMMUN: 'MEMBER',
  MEMBRE_PARQUET: 'MEMBER',
  MEMBRE_SIEGE: 'MEMBER',
  OFFICER: 'SECRETARIAT',
  PRESIDENT_PARQUET: 'PRESIDENCY',
  PRESIDENT_SIEGE: 'PRESIDENCY',
  SECRETARY: 'SECRETARIAT',
} as const satisfies Record<AdminUserRoleEnum, AdminUserRoleGroup>;

export function adminUserRoleGroupOf(role: AdminUserRoleEnum): AdminUserRoleGroup {
  return GROUP_OF_ROLE[role];
}

/** the order of the choice lists, which differs from the one of the enum */
const ROLES_IN_SELECTION_ORDER = Object.values({
  PRESIDENT_PARQUET: 'PRESIDENT_PARQUET',
  PRESIDENT_SIEGE: 'PRESIDENT_SIEGE',
  DEPUTY_PRESIDENT_PARQUET: 'DEPUTY_PRESIDENT_PARQUET',
  DEPUTY_PRESIDENT_SIEGE: 'DEPUTY_PRESIDENT_SIEGE',
  MEMBRE_COMMUN: 'MEMBRE_COMMUN',
  MEMBRE_PARQUET: 'MEMBRE_PARQUET',
  MEMBRE_SIEGE: 'MEMBRE_SIEGE',
  FIRST_SECRETARY: 'FIRST_SECRETARY',
  SECRETARY: 'SECRETARY',
  OFFICER: 'OFFICER',
} satisfies { [K in AdminUserRoleEnum]: K });

export function adminUserRolesOf(group: AdminUserRoleGroup): AdminUserRoleEnum[] {
  return ROLES_IN_SELECTION_ORDER.filter((role) => GROUP_OF_ROLE[role] === group);
}
