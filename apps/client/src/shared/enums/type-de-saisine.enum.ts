import type { DetailedNominationSessionDto } from '@api/types';

export type TypeDeSaisineEnum = NonNullable<DetailedNominationSessionDto['typeDeSaisine']>;

export const TypeDeSaisineEnum = {
  TRANSPARENCE_GDS: 'TRANSPARENCE_GDS',
} as const satisfies Record<TypeDeSaisineEnum, TypeDeSaisineEnum>;
