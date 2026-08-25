import { type ColumnDef, getCoreRowModel, getSortedRowModel, useReactTable } from '@tanstack/react-table';
import { useCallback, useMemo, useState } from 'react';

import { useSelectionColumn } from './hooks/useSelectionColumn';
import { NewTable } from './NewTable';

export type Person = {
  age: number;
  city: string;
  email: string;
  firstName: string;
  id: string;
  lastName: string;
};

const FIRST_NAMES = ['Camille', 'Lucas', 'Inès', 'Noé', 'Léa', 'Yanis', 'Jade', 'Hugo'];
const LAST_NAMES = ['Martin', 'Bernard', 'Dubois', 'Petit', 'Robert', 'Moreau', 'Laurent', 'Simon'];
const CITIES = ['Paris', 'Lyon', 'Marseille', 'Lille', 'Nantes', 'Bordeaux', 'Toulouse', 'Rennes'];

export function makePeople(count: number): Person[] {
  return Array.from({ length: count }, (_, index) => {
    const firstName = FIRST_NAMES[index % FIRST_NAMES.length];
    const lastName = LAST_NAMES[index % LAST_NAMES.length];
    return {
      age: 20 + (index % 45),
      city: CITIES[index % CITIES.length],
      email: `${firstName}.${lastName}.${index}@example.fr`.toLowerCase(),
      firstName,
      id: `person-${index}`,
      lastName,
    };
  });
}

export const peopleColumns: ColumnDef<Person>[] = [
  { accessorKey: 'firstName', header: 'Prénom', size: 160 },
  { accessorKey: 'lastName', header: 'Nom', size: 160 },
  { accessorKey: 'age', header: 'Âge', size: 100 },
  { accessorKey: 'city', header: 'Ville', size: 160 },
  { accessorKey: 'email', enableSorting: false, header: 'Email', size: 280 },
];

const ROW_TINTS = {
  blue: 'hover:bg-(--background-open-blue-france)',
  yellow: 'hover:bg-(--background-contrast-yellow-moutarde)',
} as const;

export function DemoTable(props: {
  enableSorting?: boolean;
  height?: number;
  lockedRowIds?: readonly string[];
  rowCount?: number;
  rowTint?: keyof typeof ROW_TINTS;
  unvirtualized?: boolean;
  withSelection?: boolean;
}) {
  const data = useMemo(() => makePeople(props.rowCount ?? 100), [props.rowCount]);
  const selectionColumn = useSelectionColumn<Person>({
    lockedLabel: (row) => (row.index % 2 === 0 ? 'déjà traitée' : 'hors périmètre'),
  });

  const columns = useMemo(
    () => (props.withSelection ? [selectionColumn, ...peopleColumns] : peopleColumns),
    [props.withSelection, selectionColumn],
  );

  const table = useReactTable({
    columns,
    data,
    enableRowSelection: props.lockedRowIds
      ? (row) => !props.lockedRowIds?.includes(row.id)
      : (props.withSelection ?? false),
    enableSorting: props.enableSorting ?? false,
    getCoreRowModel: getCoreRowModel(),
    getRowId: (row) => row.id,
    getSortedRowModel: getSortedRowModel(),
  });

  return (
    <div style={{ height: props.height ?? 480 }}>
      <NewTable
        emptyLabel="Aucune donnée"
        rowTint={props.rowTint ? () => ROW_TINTS[props.rowTint!] : undefined}
        table={table}
        unvirtualized={props.unvirtualized}
      />
    </div>
  );
}

const INFINITE_TOTAL = 1000;
const INFINITE_PAGE_SIZE = 50;

export function InfiniteDemoTable(props: { height?: number }) {
  const all = useMemo(() => makePeople(INFINITE_TOTAL), []);
  const [loaded, setLoaded] = useState(INFINITE_PAGE_SIZE);
  const [isFetchingNextPage, setIsFetchingNextPage] = useState(false);

  const hasNextPage = loaded < INFINITE_TOTAL;
  const data = useMemo(() => all.slice(0, loaded), [all, loaded]);

  const fetchNextPage = useCallback(() => {
    setIsFetchingNextPage(true);
    setTimeout(() => {
      setLoaded((current) => Math.min(current + INFINITE_PAGE_SIZE, INFINITE_TOTAL));
      setIsFetchingNextPage(false);
    }, 300);
  }, []);

  const table = useReactTable({
    columns: peopleColumns,
    data,
    getCoreRowModel: getCoreRowModel(),
    getRowId: (row) => row.id,
  });

  return (
    <div style={{ height: props.height ?? 480 }}>
      <NewTable
        emptyLabel="Aucune donnée"
        onEndReached={() => {
          if (hasNextPage && !isFetchingNextPage) fetchNextPage();
        }}
        table={table}
      />
    </div>
  );
}
