import { Magistrat } from 'shared-models';

import { PrismaFormationEnum } from 'src/generated/prisma/enums';
import { assertNever } from 'src/utils/assert-never';

export function prismaFormationEnumToFormationEnum(value: PrismaFormationEnum): Magistrat.Formation {
  switch (value) {
    case 'PARQUET':
      return Magistrat.Formation.PARQUET;
    case 'SIEGE':
      return Magistrat.Formation.SIEGE;
    default:
      return assertNever(value);
  }
}

export function formationEnumToPrismaFormationEnum(value: Magistrat.Formation): PrismaFormationEnum {
  switch (value) {
    case Magistrat.Formation.PARQUET:
      return 'PARQUET';
    case Magistrat.Formation.SIEGE:
      return 'SIEGE';
    default:
      return assertNever(value);
  }
}

export function formationLabel(value: Magistrat.Formation | PrismaFormationEnum): string {
  switch (value) {
    case PrismaFormationEnum.PARQUET:
    case Magistrat.Formation.PARQUET:
      return 'Parquet';
    case PrismaFormationEnum.SIEGE:
    case Magistrat.Formation.SIEGE:
      return 'Siège';

    default:
      return assertNever(value);
  }
}
