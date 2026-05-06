import { defineMessage, type MessageDescriptor } from 'react-intl';

import type { DetailedAdminUserDto } from '@api/types';

export type AdminUserRoleEnum = DetailedAdminUserDto['role'];
export const AdminUserRoleLabel = {
  PRESIDENT_SIEGE: defineMessage({
    defaultMessage: `{gender, select,
      MALE {Président du Siège}
      FEMALE {Présidente du Siège}
      other {Président(e) du Siège}}`,
  }),
  PRESIDENT_PARQUET: defineMessage({
    defaultMessage: `{gender, select,
      MALE {Président du Parquet}
      FEMALE {Présidente du Parquet}
      other {Président(e) du Parquet}}`,
  }),
  FIRST_SECRETARY: defineMessage({
    defaultMessage: `{gender, select,
      MALE {Secrétaire Général}
      FEMALE {Secrétaire Générale}
      other {Secrétaire Général(e)}}`,
  }),
  DEPUTY_PRESIDENT_PARQUET: defineMessage({
    defaultMessage: `{gender, select,
      MALE {Président du Parquet suppléant}
      FEMALE {Présidente du Parquet suppléante}
      other {Président(e) du Parquet suppléant(e)}}`,
  }),
  DEPUTY_PRESIDENT_SIEGE: defineMessage({
    defaultMessage: `{gender, select,
      MALE {Président du Siège suppléant}
      FEMALE {Présidente du Siège suppléante}
      other {Président(e) du Siège suppléant(e)}}`,
  }),
  MEMBRE_COMMUN: defineMessage({ defaultMessage: `Membre commun` }),
  MEMBRE_PARQUET: defineMessage({ defaultMessage: `Membre du Parquet` }),
  MEMBRE_SIEGE: defineMessage({ defaultMessage: `Membre du Siège` }),
  OFFICER: defineMessage({
    defaultMessage: `{gender, select,
      MALE {Agent Pôle Nomination}
      FEMALE {Agente Pôle Nomination}
      other {Agent(e) Pôle Nomination}}`,
  }),
  SECRETARY: defineMessage({
    defaultMessage: `{gender, select,
      MALE {Secrétaire Général Adjoint}
      FEMALE {Secrétaire Générale Adjointe}
      other {Secrétaire Général(e) Adjoint(e)}}`,
  }),
} as const satisfies Record<AdminUserRoleEnum, MessageDescriptor>;

function labelize(
  ...ids: readonly AdminUserRoleEnum[]
): { id: AdminUserRoleEnum; label: MessageDescriptor }[] {
  return ids.map((id) => ({ id, label: AdminUserRoleLabel[id] }));
}

export const ROLE_OPTIONS = [
  {
    name: 'Présidents / Suppléants',
    options: labelize(
      'PRESIDENT_PARQUET',
      'PRESIDENT_SIEGE',
      'DEPUTY_PRESIDENT_PARQUET',
      'DEPUTY_PRESIDENT_SIEGE',
    ),
  },
  {
    name: 'Membre',
    options: labelize('MEMBRE_COMMUN', 'MEMBRE_PARQUET', 'MEMBRE_SIEGE'),
  },
  {
    name: 'Secrétariat Général',
    options: labelize('FIRST_SECRETARY', 'SECRETARY', 'OFFICER'),
  },
] as const;

export const PROMOTABLE_ROLES: AdminUserRoleEnum[] = ['FIRST_SECRETARY', 'SECRETARY', 'OFFICER'];
