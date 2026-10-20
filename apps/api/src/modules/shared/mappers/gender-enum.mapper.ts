import { PrismaGenderEnum } from '../../../generated/prisma/enums';
import { assertNever } from '../../../utils/assert-never';
import { GenderEnum } from '../gender.enum';

export function prismaGenderEnumToGenderEnum(value: PrismaGenderEnum): GenderEnum {
  switch (value) {
    case PrismaGenderEnum.MALE:
      return GenderEnum.MALE;
    case PrismaGenderEnum.FEMALE:
      return GenderEnum.FEMALE;
    default:
      return assertNever(value);
  }
}

export function genderEnumToPrismaGenderEnum(value: GenderEnum): PrismaGenderEnum {
  switch (value) {
    case GenderEnum.MALE:
      return PrismaGenderEnum.MALE;
    case GenderEnum.FEMALE:
      return PrismaGenderEnum.FEMALE;
    default:
      return assertNever(value);
  }
}
