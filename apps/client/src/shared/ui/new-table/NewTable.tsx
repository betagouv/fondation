import { flexRender, type Header, type Row, type RowData, type Table } from '@tanstack/react-table';
import clsx from 'clsx';
import { type ReactNode, useEffect, useRef, useState } from 'react';

import { useTableVirtualizer } from './hooks/useTableVirtualizer';

function SortIcon(props: { direction: false | 'asc' | 'desc' }) {
  const glyph = props.direction === 'asc' ? '▲' : props.direction === 'desc' ? '▼' : '↕';
  return (
    <span aria-hidden className="text-xs text-(--text-mention-grey)">
      {glyph}
    </span>
  );
}

function HeaderCell<Data extends RowData>(props: { fluid?: boolean; header: Header<Data, unknown> }) {
  const { header } = props;
  const sticky = header.column.columnDef.meta?.sticky;
  const canSort = header.column.getCanSort();
  const direction = header.column.getIsSorted();
  const ariaSort = direction === 'asc' ? 'ascending' : direction === 'desc' ? 'descending' : 'none';

  return (
    <div
      aria-sort={canSort ? ariaSort : undefined}
      className={clsx(
        'flex h-12 items-center overflow-hidden px-4 leading-6 font-bold text-ellipsis whitespace-nowrap text-(--text-default-grey)',
        sticky && 'sticky left-0 z-3 border-r border-(--border-default-grey) bg-(--background-contrast-grey)',
      )}
      role="columnheader"
      style={
        props.fluid
          ? { flexBasis: header.getSize(), flexGrow: header.getSize(), minWidth: 0 }
          : { width: header.getSize() }
      }
    >
      {canSort ? (
        <button
          className="inline-flex cursor-pointer items-center gap-1 border-none bg-transparent p-0 leading-6 font-bold text-(--text-default-grey) hover:text-(--text-action-high-blue-france)"
          onClick={header.column.getToggleSortingHandler()}
          type="button"
        >
          {flexRender(header.column.columnDef.header, header.getContext())}
          <SortIcon direction={direction} />
        </button>
      ) : (
        flexRender(header.column.columnDef.header, header.getContext())
      )}
    </div>
  );
}

export function NewTable<Data extends RowData>(props: {
  ariaLabel?: string;
  className?: string;
  emptyLabel?: ReactNode;
  fluid?: boolean;
  isLoading?: boolean;
  onEndReached?: () => void;
  revealedRowId?: string | null;
  rowTint?: (row: Row<Data>) => string | undefined;
  table: Table<Data>;
  unvirtualized?: boolean;
  visibleRows?: number;
}) {
  const [scrollBox, setScrollBox] = useState<HTMLDivElement | null>(null);
  const headerRef = useRef<HTMLDivElement>(null);
  const { onEndReached, table, visibleRows } = props;

  const rows = table.getRowModel().rows;
  const totalRows = rows.length;
  const virtualizer = useTableVirtualizer({ rowCount: totalRows, scrollBox });
  const virtualRows = virtualizer.getVirtualItems();

  const lastRenderedIndex = virtualRows.at(-1)?.index;
  useEffect(() => {
    if (onEndReached && lastRenderedIndex !== undefined && lastRenderedIndex >= totalRows - 1) {
      onEndReached();
    }
  }, [onEndReached, lastRenderedIndex, totalRows]);

  const { revealedRowId } = props;
  const revealedIndex = revealedRowId ? rows.findIndex((row) => row.id === revealedRowId) : -1;
  const alreadyRevealedRef = useRef<{ rowId: string; scrollBox: HTMLDivElement } | null>(null);

  useEffect(() => {
    if (!revealedRowId || revealedIndex === -1 || !scrollBox) return;
    if (
      alreadyRevealedRef.current?.rowId === revealedRowId &&
      alreadyRevealedRef.current.scrollBox === scrollBox
    )
      return;

    alreadyRevealedRef.current = { rowId: revealedRowId, scrollBox };

    const rowElement = scrollBox.querySelector(`[data-index="${revealedIndex}"]`);
    if (rowElement) {
      const row = rowElement.getBoundingClientRect();
      const box = scrollBox.getBoundingClientRect();
      const headerHeight = headerRef.current?.offsetHeight ?? 0;
      const isFullyVisible = row.top >= box.top + headerHeight && row.bottom <= box.bottom;
      if (isFullyVisible) return;
    }

    virtualizer.scrollToIndex(revealedIndex, { align: 'center' });
  }, [revealedIndex, revealedRowId, scrollBox, virtualizer]);

  const [visibleRowsHeight, setVisibleRowsHeight] = useState<number>();

  useEffect(() => {
    if (!visibleRows) return;
    if (totalRows === 0) {
      setVisibleRowsHeight(undefined);
      return;
    }

    const lastVisibleIndex = Math.min(visibleRows, totalRows) - 1;
    const lastVisible = virtualRows.find(({ index }) => index === lastVisibleIndex);
    if (lastVisible) {
      setVisibleRowsHeight(lastVisible.start + lastVisible.size + (headerRef.current?.offsetHeight ?? 0));
    }
  }, [totalRows, virtualRows, visibleRows]);

  const isEmpty = !props.isLoading && totalRows === 0;

  return (
    <div
      aria-label={props.ariaLabel}
      className={clsx(
        'relative overflow-auto border border-(--border-contrast-grey) bg-(--background-default-grey) focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--border-action-high-blue-france)',
        props.unvirtualized ? 'w-full' : 'size-full',
        props.className,
      )}
      ref={setScrollBox}
      role={props.ariaLabel ? 'region' : undefined}
      style={visibleRowsHeight === undefined ? undefined : { height: visibleRowsHeight }}
      tabIndex={0}
    >
      <div aria-rowcount={totalRows} className="grid w-full text-sm text-(--text-default-grey)" role="table">
        <div
          className="sticky top-0 z-2 grid bg-(--background-contrast-grey)"
          ref={headerRef}
          role="rowgroup"
        >
          {table.getHeaderGroups().map((group) => (
            <div className="flex w-full border-b border-(--border-default-grey)" key={group.id} role="row">
              {group.headers.map((header) => (
                <HeaderCell fluid={props.fluid} header={header} key={header.id} />
              ))}
            </div>
          ))}
        </div>

        <div
          className="grid"
          role="rowgroup"
          style={
            props.unvirtualized
              ? undefined
              : {
                  paddingTop: virtualRows[0]?.start ?? 0,
                  paddingBottom: virtualizer.getTotalSize() - (virtualRows.at(-1)?.end ?? 0),
                }
          }
        >
          {isEmpty ? (
            <div className="p-8 text-center text-(--text-mention-grey)" role="row">
              <div role="cell">{props.emptyLabel ?? 'Aucune donnée'}</div>
            </div>
          ) : null}

          {(props.unvirtualized ? rows.map((_, index) => ({ index, start: 0 })) : virtualRows).map(
            (virtualRow) => {
              const row = rows[virtualRow.index];
              return (
                <div
                  aria-rowindex={virtualRow.index + 1}
                  aria-selected={row.getCanSelect() ? row.getIsSelected() : undefined}
                  className={clsx(
                    'flex min-h-12 w-full border-b border-(--border-default-grey)',
                    'motion-safe:transition-colors motion-safe:duration-200 motion-safe:ease-out',
                    props.rowTint?.(row) ?? 'aria-selected:bg-(--background-open-blue-france)',
                  )}
                  data-index={virtualRow.index}
                  key={row.id}
                  ref={props.unvirtualized ? undefined : virtualizer.measureElement}
                  role="row"
                >
                  {row.getVisibleCells().map((cell) => {
                    const sticky = cell.column.columnDef.meta?.sticky;
                    return (
                      <div
                        className={clsx(
                          'flex items-center overflow-hidden px-4 py-3 wrap-break-word',
                          sticky && 'sticky left-0 z-1 border-r border-(--border-default-grey) bg-inherit',
                        )}
                        key={cell.id}
                        role="cell"
                        style={
                          props.fluid
                            ? {
                                flexBasis: cell.column.getSize(),
                                flexGrow: cell.column.getSize(),
                                minWidth: 0,
                              }
                            : { width: cell.column.getSize() }
                        }
                      >
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </div>
                    );
                  })}
                </div>
              );
            },
          )}
        </div>
      </div>
    </div>
  );
}
