export type AgendaBlockFile = {
  kind: 'file';
  weight: number;
  nominationFileId: string | null;
  edited: boolean;
  editedAt: Date | null;
  outdated: boolean;
  generatedHtml?: string;
  html: string;
  id: bigint;
};
