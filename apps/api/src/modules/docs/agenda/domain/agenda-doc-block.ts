export type AgendaBlockFile = {
  kind: 'file';
  weight: number;
  nominationFileId: string | null;
  edited: boolean;
  editedAt: Date | null;
  editedBy: { id: string; name: string } | null;
  outdated: boolean;
  generatedHtml?: string;
  html: string;
  id: bigint;
};
