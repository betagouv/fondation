import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

type ZodAbstractSortable = z.ZodObject<{
  sortBy: z.ZodOptional<z.ZodEnum>;
}>;

type ToSortable<Schema> =
  Schema extends z.ZodObject<infer Shape>
    ? z.ZodObject<
        Shape & {
          sortDesc: z.ZodCodec<z.ZodOptional<z.ZodUnion<readonly [z.ZodString, z.ZodBoolean]>>, z.ZodBoolean>;
        }
      >
    : never;

export function createSortableDto<const Schema extends ZodAbstractSortable>(schema: Schema) {
  const extendedSchema = schema.safeExtend({
    sortDesc: z.codec(z.union([z.string(), z.boolean()]).optional().describe('true'), z.boolean(), {
      decode: (str) => str === 'true' || str === true,
      encode: (value) => value.toString(),
    }),
  });

  return createZodDto(extendedSchema as ToSortable<Schema>);
}

type SortableField<Schema> = Schema extends string
  ? Schema
  : Schema extends z.ZodObject<{ sortBy: z.ZodOptional<infer Fields> }>
    ? z.infer<Fields>
    : string;

export type Sortable<Schema = unknown> = Schema extends {
  sortBy?: infer Field extends string;
  sortDesc?: boolean;
}
  ? { sortBy: Field | undefined; sortDesc: boolean }
  : { sortBy: SortableField<Schema> | undefined; sortDesc: boolean };
