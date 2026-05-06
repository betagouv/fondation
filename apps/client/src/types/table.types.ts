export type SortDirection = 'asc' | 'desc' | null;

export const ITEMS_PAR_PAGE = [
  {
    value: 50,
    label: '50 lignes par page',
  },
  {
    value: 100,
    label: '100 lignes par page',
  },
  {
    value: 150,
    label: '150 lignes par page',
  },
  {
    value: 200,
    label: '200 lignes par page',
  },
] as const;
