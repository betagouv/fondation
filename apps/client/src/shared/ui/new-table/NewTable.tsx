import { flexRender, type Header, type Row, type RowData, type Table } from '@tanstack/react-table';
import clsx from 'clsx';
import { type ReactNode, type RefObject, useEffect, useLayoutEffect, useRef, useState } from 'react';

import { ESTIMATED_ROW_HEIGHT, useTableVirtualizer } from './hooks/useTableVirtualizer';

function useScrollMargin(element: HTMLDivElement | null, scrollsWithPage?: boolean) {
  const [scrollMargin, setScrollMargin] = useState(0);

  useLayoutEffect(() => {
    if (!element || !scrollsWithPage) return;

    const measure = () => setScrollMargin(element.getBoundingClientRect().top + window.scrollY);

    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(document.body);
    window.addEventListener('resize', measure);

    return () => {
      observer.disconnect();
      window.removeEventListener('resize', measure);
    };
  }, [element, scrollsWithPage]);

  return scrollMargin;
}

/** centring one of the first rows would rewind the page above the table and unpin the session bar */
function lowestScrollKeepingTheHeaderStuck(scrollBox: HTMLElement, header: RefObject<HTMLDivElement | null>) {
  const stuckTop = header.current ? parseFloat(getComputedStyle(header.current).top) || 0 : 0;

  return Math.ceil(scrollBox.getBoundingClientRect().top + window.scrollY - stuckTop) + 1;
}

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
        header.column.columnDef.meta?.headerClassName,
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
  emptyLabel: ReactNode;
  fluid?: boolean;
  isLoading?: boolean;
  onEndReached?: () => void;
  revealedRowId?: string | null;
  rowTint?: (row: Row<Data>) => string | undefined;
  scrollsWithPage?: boolean;
  table: Table<Data>;
  unvirtualized?: boolean;
  visibleRows?: number;
}) {
  const [scrollBox, setScrollBox] = useState<HTMLDivElement | null>(null);
  const headerRef = useRef<HTMLDivElement>(null);
  const { onEndReached, scrollsWithPage, table, visibleRows } = props;

  const rows = table.getRowModel().rows;
  const totalRows = rows.length;
  const scrollMargin = useScrollMargin(scrollBox, scrollsWithPage);
  const virtualizer = useTableVirtualizer({ rowCount: totalRows, scrollBox, scrollMargin, scrollsWithPage });
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
    /** every offset the virtualizer gives is short of the page above the table until this is measured */
    if (scrollsWithPage && scrollMargin === 0) return;
    if (
      alreadyRevealedRef.current?.rowId === revealedRowId &&
      alreadyRevealedRef.current.scrollBox === scrollBox
    )
      return;

    alreadyRevealedRef.current = { rowId: revealedRowId, scrollBox };

    const rowElement = scrollBox.querySelector(`[data-index="${revealedIndex}"]`);
    if (rowElement) {
      const row = rowElement.getBoundingClientRect();
      const box = scrollsWithPage
        ? { bottom: window.innerHeight, top: headerRef.current?.getBoundingClientRect().top ?? 0 }
        : scrollBox.getBoundingClientRect();
      const headerHeight = headerRef.current?.offsetHeight ?? 0;
      const isFullyVisible = row.top >= box.top + headerHeight && row.bottom <= box.bottom;
      if (isFullyVisible) return;
    }

    const centered = scrollsWithPage
      ? virtualizer.getOffsetForIndex(revealedIndex, 'center')?.[0]
      : undefined;

    if (centered === undefined) {
      virtualizer.scrollToIndex(revealedIndex, { align: 'center' });
      return;
    }

    virtualizer.scrollToOffset(Math.max(centered, lowestScrollKeepingTheHeaderStuck(scrollBox, headerRef)), {
      align: 'start',
    });
  }, [revealedIndex, revealedRowId, scrollBox, scrollMargin, scrollsWithPage, virtualizer]);

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

  const unvirtualizedMaxHeight =
    props.unvirtualized && visibleRows ? (visibleRows + 1) * ESTIMATED_ROW_HEIGHT : undefined;

  return (
    <div
      aria-label={props.ariaLabel}
      className={clsx(
        'relative border border-(--border-contrast-grey) bg-(--background-default-grey) focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--border-action-high-blue-france)',
        scrollsWithPage ? 'w-full border-t-0' : 'overflow-auto',
        !scrollsWithPage && (props.unvirtualized ? 'w-full' : 'size-full'),
        props.className,
      )}
      ref={setScrollBox}
      role={props.ariaLabel ? 'region' : undefined}
      style={
        scrollsWithPage
          ? undefined
          : unvirtualizedMaxHeight === undefined
            ? visibleRowsHeight === undefined
              ? undefined
              : { height: visibleRowsHeight }
            : { maxHeight: unvirtualizedMaxHeight }
      }
      tabIndex={scrollsWithPage ? undefined : 0}
    >
      <div aria-rowcount={totalRows} className="grid w-full text-sm text-(--text-default-grey)" role="table">
        <div
          className={clsx(
            'sticky z-2 grid bg-(--background-contrast-grey)',
            scrollsWithPage
              ? 'top-(--fondation-table-header-top) border-t border-(--border-contrast-grey)'
              : 'top-0',
          )}
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
                  paddingTop: (virtualRows[0]?.start ?? scrollMargin) - scrollMargin,
                  paddingBottom:
                    virtualizer.getTotalSize() - ((virtualRows.at(-1)?.end ?? scrollMargin) - scrollMargin),
                }
          }
        >
          {isEmpty ? (
            <div className="p-8 text-center text-(--text-mention-grey)" role="row">
              <div role="cell">{props.emptyLabel}</div>
            </div>
          ) : null}

          {(props.unvirtualized ? rows.map((_, index) => ({ index, start: 0 })) : virtualRows).map(
            (virtualRow) => {
              const row = rows[virtualRow.index];
              const isSelected = row.getIsSelected();
              const opensSelection = isSelected && !rows[virtualRow.index - 1]?.getIsSelected();
              const closesSelection = isSelected && !rows[virtualRow.index + 1]?.getIsSelected();
              return (
                <div
                  aria-rowindex={virtualRow.index + 1}
                  aria-selected={row.getCanSelect() ? isSelected : undefined}
                  className={clsx(
                    'flex min-h-12 w-full border-b border-(--border-default-grey)',
                    'motion-safe:transition-colors motion-safe:duration-200 motion-safe:ease-out',
                    props.rowTint?.(row),
                    opensSelection && 'border-t border-t-(--border-active-blue-france)',
                    closesSelection && 'border-b-(--border-active-blue-france)',
                  )}
                  data-index={virtualRow.index}
                  key={row.id}
                  ref={props.unvirtualized ? undefined : virtualizer.measureElement}
                  role="row"
                >
                  {row.getVisibleCells().map((cell) => {
                    const sticky = cell.column.columnDef.meta?.sticky;
                    const background = cell.column.columnDef.meta?.cellBackground?.(row);
                    return (
                      <div
                        className={clsx(
                          'flex items-center overflow-hidden px-4 py-3 wrap-break-word',
                          sticky && 'sticky left-0 z-1 border-r border-(--border-default-grey)',
                          sticky && !background && 'bg-inherit',
                          background,
                          cell.column.columnDef.meta?.cellClassName?.(row),
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
