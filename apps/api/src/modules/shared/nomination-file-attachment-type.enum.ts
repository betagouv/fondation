export const NominationFileAttachmentTypeEnum = {
  AUTRE: 'AUTRE',
  FICHE_DE_JURIDICTION: 'FICHE_DE_JURIDICTION',
  NOTE_INTENTION: 'NOTE_INTENTION',
} as const;
export type NominationFileAttachmentTypeEnum =
  (typeof NominationFileAttachmentTypeEnum)[keyof typeof NominationFileAttachmentTypeEnum];
