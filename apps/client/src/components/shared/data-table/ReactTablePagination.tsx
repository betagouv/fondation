import type { RowData, Table } from '@tanstack/react-table';
import React from 'react';

import { ITEMS_PAR_PAGE } from '@/types/table.types';
import Pagination from '@codegouvfr/react-dsfr/Pagination';
import Select from '@codegouvfr/react-dsfr/Select';
import { FormattedMessage } from 'react-intl';
import { useDataTablePaginationItemLabel } from './hooks/useDataTablePaginationItemLabel';

function ReactTablePaginationDescriptionPart<Data>(props: { table: Table<Data> }) {
  const totalItemsCount = props.table.getRowCount();
  const displayedItemsCount = props.table.getPaginationRowModel().rows.length;
  const itemLabel = useDataTablePaginationItemLabel(props.table);

  return (
    <div className="test-gray-600 text-nowrap text-xs">
      <span className="md:hidden">
        <FormattedMessage
          defaultMessage={`{displayedItemsCount, number} / {totalItemsCount, number} {itemLabel}`}
          values={{ displayedItemsCount, totalItemsCount, itemLabel }}
        />
      </span>
      <span className="hidden md:block">
        <FormattedMessage
          defaultMessage={`Affichage de {displayedItemsCount, number} sur {totalItemsCount, number} {itemLabel}`}
          values={{ displayedItemsCount, totalItemsCount, itemLabel }}
        />
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
      className={'flex max-w-[400px] shrink-0'}
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
  const paginationRef = React.useRef<HTMLDivElement | null>(null);

  const getPageLinkProps = React.useCallback(
    (pageNumber: number) => ({
      to: '#',
      onClick: () => {
        props.table.setPageIndex(pageNumber - 1);

        // TODO: should we improve this?
        const $tableHead = paginationRef.current
          ?.closest('.table-pagination')
          ?.parentElement?.querySelector('.table-content thead');

        $tableHead?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }),
    [props.table]
  );

  if (pageCount <= 1) return null;

  return (
    <Pagination
      ref={paginationRef}
      showFirstLast
      count={pageCount}
      defaultPage={pageIndex + 1}
      classes={{ list: 'flex-nowrap' }}
      getPageLinkProps={getPageLinkProps}
    />
  );
}

export function ReactTablePagination<Data extends RowData>(props: { table: Table<Data> }) {
  if (props.table.options.meta?.paginationEnabled === false) return null;

  return (
    <div className="mt-6 flex items-end justify-between">
      <div className="flex flex-wrap items-center gap-x-8 gap-y-2">
        <ReactTablePaginationDescriptionPart table={props.table} />
        <ReactTablePaginationSizeSelector table={props.table} />
      </div>

      <ReactTablePaginationPart table={props.table} />
    </div>
  );
}
