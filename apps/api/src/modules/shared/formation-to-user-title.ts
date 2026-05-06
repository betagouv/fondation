import { Magistrat } from 'shared-models';

import { USER_TITLES, UserTitleEnum } from '../administration/domain/user-enum';

export function formationToUserTitle(
  formation: Magistrat.Formation | null | undefined,
): (UserTitleEnum | undefined | null)[] {
  switch (formation) {
    case Magistrat.Formation.PARQUET:
      return ['DEPUTY_PRESIDENT_PARQUET', 'PRESIDENT_PARQUET'];
    case Magistrat.Formation.SIEGE:
      return ['DEPUTY_PRESIDENT_SIEGE', 'PRESIDENT_SIEGE'];
    default:
      return [...USER_TITLES];
  }
}
