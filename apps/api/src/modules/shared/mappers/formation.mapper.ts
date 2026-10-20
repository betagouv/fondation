import { PrismaFormationEnum } from '../../../generated/prisma/enums';
import { assertNever } from '../../../utils/assert-never';
import { FormationEnum } from '../formation.enum';

export function prismaFormationEnumToFormationEnum(value: PrismaFormationEnum): FormationEnum {
  switch (value) {
    case 'PARQUET':
      return 'PARQUET';
    case 'SIEGE':
      return 'SIEGE';
    default:
      return assertNever(value);
  }
}

export function formationEnumToPrismaFormationEnum(value: FormationEnum): PrismaFormationEnum {
  switch (value) {
    case 'PARQUET':
      return 'PARQUET';
    case 'SIEGE':
      return 'SIEGE';
    default:
      return assertNever(value);
  }
}

export function formationLabel(value: FormationEnum | PrismaFormationEnum): string {
  switch (value) {
    case 'PARQUET':
      return 'Parquet';
    case 'SIEGE':
      return 'Siège';

    default:
      return assertNever(value);
  }
}
