import type { ItemsPerPage } from '../hooks/usePagination.hook';

export type SortDirection = 'asc' | 'desc' | null;

export type Items = {
  value: ItemsPerPage;
  label: string;
};

export const ITEMS_PAR_PAGE: Items[] = [
  {
    value: 5,
    label: '5 lignes par page'
  },
  {
    value: 10,
    label: '10 lignes par page'
  },
  {
    value: 15,
    label: '15 lignes par page'
  },
  {
    value: 25,
    label: '25 lignes par page'
  },
  {
    value: 50,
    label: '50 lignes par page'
  }
];
