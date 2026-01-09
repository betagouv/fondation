import type { Table, RowData } from '@tanstack/react-table';
import React from 'react';

import { ITEMS_PAR_PAGE } from '@/types/table.types';
import Pagination from '@codegouvfr/react-dsfr/Pagination';
import Select from '@codegouvfr/react-dsfr/Select';

function ReactTablePaginationDescriptionPart<Data>(props: { table: Table<Data> }) {
  const totalItemsCount = props.table.getRowCount();
  const displayedItemsCount = props.table.getPaginationRowModel().rows.length;

  const template = props.table.options.meta?.pagination?.itemLabel;
  const itemLabel =
    template !== undefined && template !== null
      ? typeof template === 'string'
        ? ` ${template}`
        : displayedItemsCount > 1
          ? ` ${template.other}`
          : ` ${template.one}`
      : undefined;

  return (
    <div className="test-gray-600 text-sm">
      <span className="md:hidden">
        {displayedItemsCount} / {totalItemsCount}
        {itemLabel}
      </span>
      <span className="hidden md:block">
        Affichage de {displayedItemsCount} sur {totalItemsCount}
        {itemLabel}
      </span>
    </div>
  );
}

function ReactTablePaginationSizeSelector<Data>(props: { table: Table<Data> }) {
  const pageSize = props.table.getState().pagination.pageSize;
  const onPageSizeChange = React.useCallback(
    (event: React.ChangeEvent<HTMLSelectElement>) => {
      const newPageSize = Number(event.target.value);
      props.table.setPageSize(newPageSize);
    },
    [props.table]
  );

  return (
    <Select
      label=""
      className={'flex max-w-[400px]'}
      nativeSelectProps={{ value: pageSize, onChange: onPageSizeChange }}
    >
      {ITEMS_PAR_PAGE.map((item) => (
        <option key={item.value} value={item.value}>
          {item.label}
        </option>
      ))}
    </Select>
  );
}

function ReactTablePaginationPart<Data extends RowData>(props: { table: Table<Data> }) {
  const pageCount = props.table.getPageCount();
  const { pageIndex } = props.table.getState().pagination;

  return (
    <Pagination
      showFirstLast
      defaultPage={pageIndex}
      count={pageCount}
      getPageLinkProps={(newPageIndex) => ({
        onClick: () => {
          props.table.setPageIndex(newPageIndex);
        },

        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-expect-error
        to: undefined
      })}
    />
  );
}

export function ReactTablePagination<Data extends RowData>(props: { table: Table<Data> }) {
  if (props.table.options.meta?.pagination?.enabled === false) return null;

  return (
    <div className="flex items-center justify-between gap-16">
      <div className="flex items-center gap-6">
        <ReactTablePaginationDescriptionPart table={props.table} />
        <ReactTablePaginationSizeSelector table={props.table} />
      </div>

      <ReactTablePaginationPart table={props.table} />
    </div>
  );
}
