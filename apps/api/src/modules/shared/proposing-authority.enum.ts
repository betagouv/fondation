export const ProposingAuthorityEnum = {
  GARDE_DES_SCEAUX: 'GARDE_DES_SCEAUX',
} as const;
export type ProposingAuthorityEnum = (typeof ProposingAuthorityEnum)[keyof typeof ProposingAuthorityEnum];

export const ProposingAuthorityEnumLabels: Record<ProposingAuthorityEnum, string> = {
  GARDE_DES_SCEAUX: 'Garde des Sceaux',
};
