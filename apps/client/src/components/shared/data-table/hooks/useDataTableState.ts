import type { TableState } from '@tanstack/react-table';
import React from 'react';

import type { DataTableState } from './data-table-state';
import { assertIsPageSize } from './assert-is-page-size';

/** when synchronizing the table state with the URL is not required, this hook is preferred over {@link useQueryDataTableState} */
export function useDataTableState<State extends Partial<DataTableState>>(
  initialState: State = {} as State
): [State, React.Dispatch<React.SetStateAction<TableState>>] {
  assertIsPageSize(initialState.pagination?.pageSize);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return React.useState<State>(initialState) as any;
}
