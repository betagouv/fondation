import { PrismaTypeDeSaisineEnum } from 'src/generated/prisma/client';
import { TypeDeSaisineEnum } from 'src/modules/shared/type-de-saisine.enum';
import { assertNever } from 'src/utils/assert-never';

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
