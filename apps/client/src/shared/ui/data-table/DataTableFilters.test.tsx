import {
  createColumnHelper,
  getCoreRowModel,
  useReactTable,
  type ColumnFiltersState,
} from '@tanstack/react-table';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { IntlProvider } from 'react-intl';
import { describe, expect, it } from 'vitest';

import { DataTableFilters } from './DataTableFilters';

type Row = { formation: string; status: string };
const h = createColumnHelper<Row>();
const COLUMNS = [
  h.accessor('status', {
    meta: {
      filters: {
        filterId: 'status',
        label: 'Statut',
        type: 'enum',
        values: [
          { id: 'OPEN', label: 'Ouvert' },
          { id: 'CLOSED', label: 'Fermé' },
        ],
      },
    },
  }),
  h.accessor('formation', {
    meta: {
      filters: {
        filterId: 'formation',
        label: 'Formation',
        multiple: false,
        type: 'enum',
        values: [
          { id: 'SIEGE', label: 'Siège' },
          { id: 'PARQUET', label: 'Parquet' },
        ],
      },
    },
  }),
];

function FilteredTable() {
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const table = useReactTable({
    columns: COLUMNS,
    data: [],
    getCoreRowModel: getCoreRowModel(),
    manualFiltering: true,
    onColumnFiltersChange: setColumnFilters,
    state: { columnFilters },
  });

  return (
    <>
      <DataTableFilters table={table} />
      <output>{JSON.stringify(columnFilters)}</output>
    </>
  );
}

describe('DataTableFilters', () => {
  it('should keep a single value in a filter that does not accept several, and the other filters', async () => {
    render(
      <IntlProvider defaultLocale="fr" locale="fr">
        <FilteredTable />
      </IntlProvider>,
    );

    await userEvent.click(screen.getByRole('button', { name: /Statut/ }));
    await userEvent.click(screen.getByLabelText('Ouvert'));
    await userEvent.click(screen.getByRole('button', { name: /Formation/ }));
    await userEvent.click(screen.getByLabelText('Siège'));
    await userEvent.click(screen.getByLabelText('Parquet'));

    expect(JSON.parse(screen.getByRole('status').textContent!)).toEqual([
      { id: 'status', value: ['OPEN'] },
      { id: 'formation', value: ['PARQUET'] },
    ]);
  });
});
