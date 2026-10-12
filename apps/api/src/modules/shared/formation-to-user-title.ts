import { USER_TITLES, UserTitleEnum } from '../administration/domain/user-enum';

import { FormationEnum } from './formation.enum';

export function formationToUserTitle(
  formation: FormationEnum | null | undefined,
): (UserTitleEnum | undefined | null)[] {
  switch (formation) {
    case 'PARQUET':
      return ['DEPUTY_PRESIDENT_PARQUET', 'PRESIDENT_PARQUET'];
    case 'SIEGE':
      return ['DEPUTY_PRESIDENT_SIEGE', 'PRESIDENT_SIEGE'];
    default:
      return [...USER_TITLES];
  }
}
