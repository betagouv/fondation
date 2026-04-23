import { Magistrat } from 'shared-models';
import { assertNever } from 'src/utils/assert-never';

export function formationToMemberRole(
  formation?: Magistrat.Formation,
): Magistrat.Formation[keyof Magistrat.Formation][] {
  switch (formation) {
    case Magistrat.Formation.PARQUET:
      return ['MEMBRE_COMMUN', 'MEMBRE_DU_PARQUET'];
    case Magistrat.Formation.SIEGE:
      return ['MEMBRE_COMMUN', 'MEMBRE_DU_SIEGE'];
    case undefined:
      return ['MEMBRE_COMMUN', 'MEMBRE_DU_SIEGE', 'MEMBRE_DU_PARQUET'];
    default:
      return assertNever(formation);
  }
}
