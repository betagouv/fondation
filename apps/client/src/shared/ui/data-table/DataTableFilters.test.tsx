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

function FilteredTable(props: { initialFilters?: ColumnFiltersState }) {
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>(props.initialFilters ?? []);
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

  it('should show nothing selected for a filter that the URL does not give as a list', async () => {
    render(
      <IntlProvider defaultLocale="fr" locale="fr">
        <FilteredTable initialFilters={[{ id: 'status', value: 5 }]} />
      </IntlProvider>,
    );

    await userEvent.click(screen.getByRole('button', { name: /Statut/ }));

    expect(screen.getByLabelText('Ouvert')).not.toBeChecked();
  });

  it('should show every filter of a column carrying several, in their order', () => {
    function SeveralFiltersTable() {
      const table = useReactTable({
        columns: [
          h.accessor('status', {
            meta: {
              filters: [
                { filterId: 'status', label: 'Statut', type: 'enum', values: [] },
                { filterId: 'deadline', label: 'Échéance', type: 'enum', values: [] },
              ],
            },
          }),
        ],
        data: [],
        getCoreRowModel: getCoreRowModel(),
        manualFiltering: true,
      });
      return <DataTableFilters table={table} />;
    }

    render(
      <IntlProvider defaultLocale="fr" locale="fr">
        <SeveralFiltersTable />
      </IntlProvider>,
    );

    expect(screen.getAllByRole('button').map((button) => button.textContent)).toEqual(['Statut', 'Échéance']);
  });
});
