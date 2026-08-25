import '@tanstack/react-table';
import type { Row, RowData } from '@tanstack/react-table';

declare module '@tanstack/react-table' {
  interface ColumnMeta {
    cellClassName?: (row: Row<RowData>) => string | undefined;
    sticky?: boolean;
  }
}
