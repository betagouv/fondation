import type { RowData, Table } from '@tanstack/react-table';
import React from 'react';
import { useIntl } from 'react-intl';

export function useDataTablePaginationItemLabel<Data extends RowData>(
  table: Table<Data>,
): string | undefined {
  const intl = useIntl();
  const count = table.getRowCount();

  return React.useMemo(() => {
    const template = table.options.meta?.paginationItemLabel;

    if (typeof template === 'undefined') return undefined;
    return intl.formatMessage(template, { count });
  }, [table, intl, count]);
}
