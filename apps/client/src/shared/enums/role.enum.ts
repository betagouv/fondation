import { defineMessages } from 'react-intl';

import type { DetailedUserResponseDto } from '@api/types';

export type RoleEnum = DetailedUserResponseDto['role'];

export const RoleEnumMessages = defineMessages({
  ADJOINT_SECRETAIRE_GENERAL: { defaultMessage: 'Secrétariat général' },
  ADMIN: { defaultMessage: 'Administrateur' },
  MEMBRE_COMMUN: { defaultMessage: 'Membre commun' },
  MEMBRE_DU_PARQUET: { defaultMessage: 'Membre du parquet' },
  MEMBRE_DU_SIEGE: { defaultMessage: 'Membre du siège' },
} satisfies Record<RoleEnum, { defaultMessage: string }>);
