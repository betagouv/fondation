import { Gender } from 'shared-models';
import { PrismaGenderEnum } from 'src/generated/prisma/enums';
import { assertNever } from 'src/utils/assert-never';

export function prismaGenderEnumToGenderEnum(value: PrismaGenderEnum): Gender {
  switch (value) {
    case PrismaGenderEnum.MALE:
      return Gender.M;
    case PrismaGenderEnum.FEMALE:
      return Gender.F;
    default:
      return assertNever(value);
  }
}

export function genderEnumToPrismaGenderEnum(value: Gender): PrismaGenderEnum {
  switch (value) {
    case Gender.M:
      return PrismaGenderEnum.MALE;
    case Gender.F:
      return PrismaGenderEnum.FEMALE;
    default:
      return assertNever(value);
  }
}
