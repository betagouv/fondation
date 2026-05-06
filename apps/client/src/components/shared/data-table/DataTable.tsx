import { cx } from '@codegouvfr/react-dsfr/fr/cx';
import { type RowData, type Table } from '@tanstack/react-table';
import clsx from 'clsx';
import type React from 'react';

import { ReactTableColumnVisibility } from './ReactTableColumnVisibility';
import { ReactTableContent } from './ReactTableContent';
import { ReactTableFilterColumn } from './ReactTableFilterColumn';
import { ReactTableFilterSearch } from './ReactTableFilterSearch';
import { ReactTablePagination } from './ReactTablePagination';

export function DataTable<Data extends RowData>(
  props: React.PropsWithChildren<{
    table: Table<Data>;
    caption?: React.ReactNode;
    placeholder?: React.ReactNode;
    classNames?: { filters?: string; content?: string; pagination?: string };
  }>,
) {
  const { table } = props;

  return (
    <div>
      {table.options.enableColumnFilters || table.options.enableGlobalFilter || props.children ? (
        <header
          className={clsx(
            'flex items-center justify-between',
            props.classNames?.filters || cx('fr-container'),
          )}
        >
          {table.options.enableColumnFilters || table.options.enableGlobalFilter ? (
            <div className="table-filters flex items-center gap-4">
              <ReactTableFilterSearch table={table} />
              <ReactTableFilterColumn table={table} />
            </div>
          ) : null}

          {props.children || table.options.meta?.columnVisibilityEnabled ? (
            <div
              className={clsx('table-filter-end', 'flex', 'items-center', {
                'self-justify-end': !table.options.enableFilters,
              })}
            >
              <div>{props.children}</div>
              <ReactTableColumnVisibility table={table} />
            </div>
          ) : null}
        </header>
      ) : null}

      <div className={`table-content ${props.classNames?.content ?? ''}`}>
        <ReactTableContent table={table} placeholder={props.placeholder}>
          {props.caption}
        </ReactTableContent>
      </div>

      {table.options.meta?.paginationEnabled !== false ? (
        <div className={`table-pagination ${props.classNames?.pagination ?? 'fr-container'}`}>
          <ReactTablePagination table={table} />
        </div>
      ) : null}
    </div>
  );
}
