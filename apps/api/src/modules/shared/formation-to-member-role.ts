import { Role } from 'shared-models';

import { assertNever } from 'src/utils/assert-never';

import { FormationEnum } from './formation.enum';

export function formationToMemberRole(formation?: FormationEnum): Role[] {
  switch (formation) {
    case 'PARQUET':
      return [Role.MEMBRE_COMMUN, Role.MEMBRE_DU_PARQUET];
    case 'SIEGE':
      return [Role.MEMBRE_COMMUN, Role.MEMBRE_DU_SIEGE];
    case undefined:
      return [Role.MEMBRE_COMMUN, Role.MEMBRE_DU_SIEGE, Role.MEMBRE_DU_PARQUET];
    default:
      return assertNever(formation);
  }
}
