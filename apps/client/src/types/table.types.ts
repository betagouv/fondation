export type SortField =
  | 'numero'
  | 'magistrat'
  | 'posteActuel'
  | 'gradeActuel'
  | 'posteCible'
  | 'gradeCible'
  | 'observants'
  | 'priorite'
  | 'rapporteurs';
export type SortDirection = 'asc' | 'desc' | null;

export type ItemParPage = {
  value: number;
  label: string;
};

export const ITEMS_PAR_PAGE: ItemParPage[] = [
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
