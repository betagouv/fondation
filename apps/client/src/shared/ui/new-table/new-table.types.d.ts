import '@tanstack/react-table';
import type { Row, RowData } from '@tanstack/react-table';

declare module '@tanstack/react-table' {
  interface ColumnMeta {
    cellBackground?: (row: Row<RowData>) => string | undefined;
    cellClassName?: (row: Row<RowData>) => string | undefined;
    headerClassName?: string;
    sticky?: boolean;
  }
}
