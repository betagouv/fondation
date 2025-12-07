import { TypeDeSaisine } from 'shared-models';
import { PrismaTypeDeSaisineEnum } from 'src/generated/prisma/client';
import { assertNever } from 'src/utils/assert-never';

export function prismaTypeDeSaisineEnumToTypeDeSaisine(
  value: PrismaTypeDeSaisineEnum,
): TypeDeSaisine {
  switch (value) {
    case 'TRANSPARENCE_GDS':
      return TypeDeSaisine.TRANSPARENCE_GDS;
    default:
      return assertNever(value);
  }
}

export function typeDeSaisineToPrismaTypeDeSaisineEnum(
  value: TypeDeSaisine,
): PrismaTypeDeSaisineEnum {
  switch (value) {
    case TypeDeSaisine.TRANSPARENCE_GDS:
      return 'TRANSPARENCE_GDS';
    default:
      return assertNever(value);
  }
}
