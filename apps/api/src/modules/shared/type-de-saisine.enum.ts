import type { ProposingAuthorityEnum } from './proposing-authority.enum';

export const TypeDeSaisineEnum = {
  TRANSPARENCE_GDS: 'TRANSPARENCE_GDS',
} as const;
export type TypeDeSaisineEnum = (typeof TypeDeSaisineEnum)[keyof typeof TypeDeSaisineEnum];

export const TypeDeSaisineEnumLabels: Record<TypeDeSaisineEnum, string> = {
  TRANSPARENCE_GDS: 'Transparence',
};

export const typeDeSaisineProposingAuthority: Record<TypeDeSaisineEnum, ProposingAuthorityEnum> = {
  TRANSPARENCE_GDS: 'GARDE_DES_SCEAUX',
};
