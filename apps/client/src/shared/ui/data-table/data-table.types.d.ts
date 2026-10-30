/* oxlint-disable @typescript-eslint/no-explicit-any */

import '@tanstack/react-table';
import type { Row, RowData } from '@tanstack/react-table';

export type TableMetaFilterEnum = {
  emptyValue?: { id: string; label: string };
  filterId: string;
  label: string;
  multiple?: false;
  type: 'enum';
  values: { id: string; label: string }[];
};

export type TableMetaFilterAsyncList = {
  emptyValue?: { id: string; label: string };
  filterId: string;
  label: string;
  multiple?: false;
  query:
    | {
        queryKey: readonly unknown[];
        queryFn: () => Promise<{ id: string; label: string }[]>;
      }
    | {
        queryKey: readonly unknown[];
        queryFn: () => Promise<any>;
        select: (data: any) => { id: string; label: string }[];
      };
  type: 'asyncList';
};

type TableMetaFilter = TableMetaFilterEnum | TableMetaFilterAsyncList;

declare module '@tanstack/react-table' {
  interface ColumnMeta<TData extends RowData, TValue> {
    cellBackground?: (row: Row<TData>) => string | undefined;
    cellClassName?: (row: Row<TData>) => string | undefined;
    /** shown in the filter bar of the table, and set on the column filters state under `filterId` */
    filters?: TableMetaFilter;
    headerClassName?: string;
    sticky?: boolean;
  }
}
