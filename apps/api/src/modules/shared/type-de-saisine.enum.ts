export const TypeDeSaisineEnum = {
  TRANSPARENCE_GDS: 'TRANSPARENCE_GDS',
} as const;
export type TypeDeSaisineEnum = (typeof TypeDeSaisineEnum)[keyof typeof TypeDeSaisineEnum];

export const TypeDeSaisineEnumLabels: Record<TypeDeSaisineEnum, string> = {
  TRANSPARENCE_GDS: 'Transparence',
};

export const ProposingAuthorityEnum = {
  GARDE_DES_SCEAUX: 'GARDE_DES_SCEAUX',
} as const;
export type ProposingAuthorityEnum = (typeof ProposingAuthorityEnum)[keyof typeof ProposingAuthorityEnum];

export const ProposingAuthorityEnumLabels: Record<ProposingAuthorityEnum, string> = {
  GARDE_DES_SCEAUX: 'Garde des Sceaux',
};

export const typeDeSaisineProposingAuthority: Record<TypeDeSaisineEnum, ProposingAuthorityEnum> = {
  TRANSPARENCE_GDS: 'GARDE_DES_SCEAUX',
};
