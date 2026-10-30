import { assertNever } from '../../utils/assert-never';

import { FormationEnum } from './formation.enum';
import type { RoleEnum } from './role.enum';

export function formationToMemberRole(formation?: FormationEnum): RoleEnum[] {
  switch (formation) {
    case 'PARQUET':
      return ['MEMBRE_COMMUN', 'MEMBRE_DU_PARQUET'];
    case 'SIEGE':
      return ['MEMBRE_COMMUN', 'MEMBRE_DU_SIEGE'];
    case undefined:
      return ['MEMBRE_COMMUN', 'MEMBRE_DU_SIEGE', 'MEMBRE_DU_PARQUET'];
    default:
      return assertNever(formation);
  }
}
