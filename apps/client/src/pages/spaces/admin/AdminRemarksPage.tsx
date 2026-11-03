import { createColumnHelper, getCoreRowModel, useReactTable } from '@tanstack/react-table';
import clsx from 'clsx';
import { useCallback, useMemo } from 'react';
import { FormattedDate, FormattedMessage, useIntl } from 'react-intl';
import { Link } from 'react-router';

import { RemarkImpersonatedLink } from '@/features/remarks/components/RemarkImpersonatedLink';
import { RemarkStatusCell } from '@/features/remarks/components/RemarkStatusCell';
import { RemarkStatusCommentModalProvider } from '@/features/remarks/components/RemarkStatusCommentModalProvider';
import { PinnedHeader } from '@/shared/components/pinned-header';
import {
  REMARK_STATUSES,
  type RemarkStatusEnum,
  RemarkStatusEnumMessages,
} from '@/shared/enums/remark-status.enum';
import { Breadcrumb } from '@/shared/ui/Breadcrumb';
import {
  DataTable,
  DataTableCount,
  DataTableFilters,
  rowCell,
  useDataTableUrlState,
} from '@/shared/ui/data-table';
import type { ListedRemarksDto } from '@api/types';
import { type RemarksSorting, useInfiniteRemarksQuery } from '@queries/remarks.queries';

type ListedRemark = ListedRemarksDto['items'][number];

const h = createColumnHelper<ListedRemark>();

const sentAtCell = rowCell<ListedRemark>((remark) => (
  <FormattedDate format="zonedDateShort" value={remark.sentAt} />
));

const authorCell = rowCell<ListedRemark>((remark) => (
  <div className="flex flex-col">
    {remark.author?.name}
    {remark.impersonated && (
      <span className="text-xs text-(--text-mention-grey)">
        <FormattedMessage
          defaultMessage="Envoyée en tant que {name}"
          values={{ name: remark.impersonated.name }}
        />
      </span>
    )}
  </div>
));

const textCell = rowCell<ListedRemark>((remark) => (
  <div className="wrap-break-word whitespace-pre-line">{remark.text}</div>
));

// a flex item would turn the link into a block, underlined under its last line only
const urlCell = rowCell<ListedRemark>((remark) => (
  <div className="break-all">
    {remark.impersonated ? (
      <RemarkImpersonatedLink impersonated={remark.impersonated} url={remark.url} />
    ) : (
      <Link
        className="box-decoration-clone after:hidden!"
        rel="noopener noreferrer"
        target="_blank"
        to={remark.url}
      >
        {remark.url}
        <span className="fr-sr-only">
          <FormattedMessage defaultMessage="(nouvel onglet)" />
        </span>
      </Link>
    )}
  </div>
));

const statusCell = rowCell<ListedRemark>((remark) => <RemarkStatusCell remark={remark} />);

function useRemarkColumns() {
  const { formatMessage } = useIntl();

  return useMemo(
    () => [
      h.accessor('sentAt', {
        cell: sentAtCell,
        enableSorting: true,
        header: formatMessage({ defaultMessage: 'Envoyée le' }),
        id: 'sentAt',
        size: 110,
      }),
      h.display({
        cell: authorCell,
        enableSorting: false,
        header: formatMessage({ defaultMessage: 'Personne' }),
        id: 'author',
        size: 250,
      }),
      h.display({
        cell: textCell,
        enableSorting: false,
        header: formatMessage({ defaultMessage: 'Remarque' }),
        id: 'text',
        size: 420,
      }),
      h.display({
        cell: urlCell,
        enableSorting: false,
        header: formatMessage({ defaultMessage: 'Page' }),
        id: 'url',
        size: 300,
      }),
      h.accessor('status', {
        cell: statusCell,
        enableSorting: true,
        header: formatMessage({ defaultMessage: 'Statut' }),
        id: 'status',
        meta: {
          filters: {
            filterId: 'status',
            label: formatMessage({ defaultMessage: 'Statut' }),
            type: 'enum',
            values: REMARK_STATUSES.map((id) => ({
              id,
              label: formatMessage(RemarkStatusEnumMessages[id]),
            })),
          },
        },
        size: 160,
      }),
    ],
    [formatMessage],
  );
}

export function AdminRemarksPage() {
  const { formatMessage } = useIntl();
  const { onColumnFiltersChange, onSortingChange, tableState } = useDataTableUrlState({
    columnFilters: [] as { id: 'status'; value: RemarkStatusEnum[] }[],
    sorting: [] as RemarksSorting,
  });
  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading } = useInfiniteRemarksQuery({
    filters: { statuses: tableState.columnFilters.find(({ id }) => id === 'status')?.value },
    sorting: tableState.sorting,
  });

  const fetchMore = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) void fetchNextPage();
  }, [fetchNextPage, hasNextPage, isFetchingNextPage]);

  const columns = useRemarkColumns();
  const isFiltered = tableState.columnFilters.some(({ value }) => value.length > 0);

  const remarks = useMemo(() => data?.items ?? [], [data]);
  const table = useReactTable({
    columns,
    data: remarks,
    getCoreRowModel: getCoreRowModel(),
    getRowId: (row) => row.id,
    manualFiltering: true,
    manualSorting: true,
    onColumnFiltersChange,
    onSortingChange,
    state: { columnFilters: tableState.columnFilters, sorting: tableState.sorting },
  });

  return (
    <div className="fr-container fr-pt-8v fr-pb-16v">
      <Breadcrumb
        ariaLabel={formatMessage({ defaultMessage: "Fil d'Ariane pour l'Administration" })}
        breadcrumb={{
          currentPageLabel: formatMessage({ defaultMessage: 'Traiter les remarques' }),
          segments: [{ label: formatMessage({ defaultMessage: 'Administration' }), to: {} }],
        }}
        id="administration-breadcrumb"
      />

      <PinnedHeader
        bar={(isPinned) => (
          <div className={clsx('flex flex-col gap-y-6', { 'fr-container': isPinned })}>
            <div className="flex items-center justify-between gap-4">
              <h1 className="fr-h3 fr-mb-0">
                <FormattedMessage defaultMessage="Traiter les remarques" />
                {data && <DataTableCount loaded={remarks.length} total={data.totalCount} />}
              </h1>
            </div>
            <DataTableFilters table={table} />
          </div>
        )}
        contentClassName="flex flex-col gap-y-6"
        pinnedBarClassName="fr-pt-6v"
      >
        <RemarkStatusCommentModalProvider>
          <DataTable
            ariaLabel={formatMessage({ defaultMessage: 'Liste des remarques' })}
            emptyLabel={
              isFiltered
                ? formatMessage({ defaultMessage: 'Aucune remarque ne correspond aux filtres fournis' })
                : formatMessage({ defaultMessage: 'Aucune remarque' })
            }
            fluid
            isLoading={isLoading}
            onEndReached={fetchMore}
            scrollsWithPage
            table={table}
          />
        </RemarkStatusCommentModalProvider>
      </PinnedHeader>
    </div>
  );
}
