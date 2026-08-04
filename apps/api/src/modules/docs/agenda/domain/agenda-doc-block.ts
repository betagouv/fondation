export type AgendaBlockFile = {
  kind: 'file';
  weight: number;
  edited: boolean;
  outdated: boolean;
  generatedHtml?: string;
  html: string;
  id: bigint;
};
