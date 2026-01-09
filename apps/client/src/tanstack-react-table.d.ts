import '@tanstack/react-table';

export type TableMetaFilterEnum = {
  type: 'enum';
  filterId: string;
  label: string;
  multiple?: false;
  values: { id: string; label: string }[];
  emptyValue?: { id: string; label: string };
};

type TableMetaFilter = TableMetaFilterEnum;

declare module '@tanstack/react-table' {
  interface ColumnMeta {
    size?: 'sm' | 'xs' | 'md' | 'lg' | `${string}%`;
    multiline?: false;
    filters?: TableMetaFilter;
  }

  interface TableMeta {
    columnSelection?: { allRowSelectionEnabled?: boolean };
    pagination?: { enabled?: false; itemLabel?: { one: string; other: string } | string };
  }

  interface GlobalFilterTableState {
    globalFilter: string;
  }
}
