import type { DetailedAdminUserDto } from '@api/types';

export type AdminUserRoleEnum = DetailedAdminUserDto['role'];
export const AdminUserRoleLabel = {
  PRESIDENT_SIEGE: 'Président(e) du Siège',
  PRESIDENT_PARQUET: 'Président(e) du Parquet',
  FIRST_SECRETARY: 'Secrétaire Général(e)',
  DEPUTY_PRESIDENT_PARQUET: 'Président(e) du Parquet suppléant(e)',
  DEPUTY_PRESIDENT_SIEGE: 'Président(e) du Siège suppléant(e)',
  MEMBRE_COMMUN: 'Membre commun',
  MEMBRE_PARQUET: 'Membre du Parquet',
  MEMBRE_SIEGE: 'Membre du Siège',
  OFFICER: 'Agent Pôle Nomination',
  SECRETARY: 'Secrétaire Adjoint(e)'
} as const satisfies Record<AdminUserRoleEnum, string>;

type Labelize<
  Ids extends readonly AdminUserRoleEnum[],
  Labelized extends { id: AdminUserRoleEnum; label: string }[] = []
> = Ids extends never[]
  ? Labelized
  : Ids extends [infer Head extends AdminUserRoleEnum, ...infer Tail extends AdminUserRoleEnum[]]
    ? Labelize<Tail, [...Labelized, { id: Head; label: (typeof AdminUserRoleLabel)[Head] }]>
    : Labelized;

function labelize<const Ids extends AdminUserRoleEnum[]>(...ids: Ids): Labelize<Ids> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return ids.map((id) => ({ id, label: AdminUserRoleLabel[id] })) as any;
}

export const ROLE_OPTIONS = [
  {
    name: 'Présidents / Suppléants',
    options: labelize(
      'PRESIDENT_PARQUET',
      'PRESIDENT_SIEGE',
      'DEPUTY_PRESIDENT_PARQUET',
      'DEPUTY_PRESIDENT_SIEGE'
    )
  },
  {
    name: 'Membre',
    options: labelize('MEMBRE_COMMUN', 'MEMBRE_PARQUET', 'MEMBRE_SIEGE')
  },
  {
    name: 'Secrétariat Général',
    options: labelize('FIRST_SECRETARY', 'SECRETARY', 'OFFICER')
  }
] as const;

export const PROMOTABLE_ROLES: AdminUserRoleEnum[] = ['FIRST_SECRETARY', 'SECRETARY', 'OFFICER'];
