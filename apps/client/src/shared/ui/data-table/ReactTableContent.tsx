import type { RowData, Table } from '@tanstack/react-table';
import type { PropsWithChildren } from 'react';

import { ReactTableBody } from './ReactTableBody';
import { ReactTableHead } from './ReactTableHead';
import { ReactTableWrapper } from './ReactTableWrapper';

export function ReactTableContent<Data extends RowData>(
  props: PropsWithChildren<{ table: Table<Data>; placeholder?: React.ReactNode }>,
) {
  return (
    <ReactTableWrapper table={props.table}>
      {props.children ? <caption>{props.children}</caption> : null}

      <ReactTableHead table={props.table} />
      <ReactTableBody table={props.table} placeholder={props.placeholder} />
    </ReactTableWrapper>
  );
}
