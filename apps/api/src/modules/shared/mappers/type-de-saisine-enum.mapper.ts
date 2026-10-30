import { PrismaTypeDeSaisineEnum } from '../../../generated/prisma/client';
import { assertNever } from '../../../utils/assert-never';
import { TypeDeSaisineEnum } from '../type-de-saisine.enum';

export function prismaTypeDeSaisineEnumToTypeDeSaisine(value: PrismaTypeDeSaisineEnum): TypeDeSaisineEnum {
  switch (value) {
    case 'TRANSPARENCE_GDS':
      return 'TRANSPARENCE_GDS';
    default:
      return assertNever(value);
  }
}

export function typeDeSaisineToPrismaTypeDeSaisineEnum(value: TypeDeSaisineEnum): PrismaTypeDeSaisineEnum {
  switch (value) {
    case 'TRANSPARENCE_GDS':
      return 'TRANSPARENCE_GDS';
    default:
      return assertNever(value);
  }
}
