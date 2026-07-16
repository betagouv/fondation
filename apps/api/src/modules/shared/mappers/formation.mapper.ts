import { FormationEnum } from '../formation.enum';
import { PrismaFormationEnum } from 'src/generated/prisma/enums';
import { assertNever } from 'src/utils/assert-never';

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
