/* oxlint-disable @typescript-eslint/no-explicit-any */

import '@tanstack/react-table';
import type { MessageDescriptor } from 'react-intl';

export type TableMetaFilterEnum = {
  type: 'enum';
  filterId: string;
  label: string;
  multiple?: false;
  values: { id: string; label: string }[];
  emptyValue?: { id: string; label: string };
};

export type TableMetaFilterAsyncList = {
  type: 'asyncList';
  filterId: string;
  label: string;
  multiple?: false;
  emptyValue?: { id: string; label: string };
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
};

type TableMetaFilter = TableMetaFilterEnum | TableMetaFilterAsyncList;

declare module '@tanstack/react-table' {
  interface ColumnMeta {
    size?: 'sm' | 'xs' | 'md' | 'lg' | `${string}%`;
    multiline?: false;
    filters?: TableMetaFilter;
  }

  interface TableMeta {
    allRowsSelectionEnabled?: boolean;
    columnVisibilityEnabled?: boolean;
    paginationEnabled?: boolean;
    paginationItemLabel?: MessageDescriptor;
  }
}
