import { TypeDeSaisine } from 'shared-models';
import * as schema from 'src/modules/framework/drizzle/schemas';
import { assertNever } from 'src/utils/assert-never';

export const typeDeSaisineEnum = schema.typeDeSaisineEnum;

type DrizzleTypeDeSaisineEnum =
  (typeof schema.typeDeSaisineEnum)['enumValues'][number];
export function toTypeDeSaisine(
  value: DrizzleTypeDeSaisineEnum,
): TypeDeSaisine {
  switch (value) {
    case 'TRANSPARENCE_GDS':
      return TypeDeSaisine.TRANSPARENCE_GDS;
    default:
      return assertNever(value);
  }
}
