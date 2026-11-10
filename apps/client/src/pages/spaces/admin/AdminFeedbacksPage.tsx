import { createColumnHelper, getCoreRowModel, useReactTable } from '@tanstack/react-table';
import clsx from 'clsx';
import { useCallback, useMemo } from 'react';
import { FormattedDate, FormattedMessage, useIntl } from 'react-intl';
import { Link } from 'react-router';

import { FeedbackOpenAsLink } from '@/features/feedbacks/components/FeedbackOpenAsLink';
import { FeedbackStatusCell } from '@/features/feedbacks/components/FeedbackStatusCell';
import { FeedbackStatusCommentModalProvider } from '@/features/feedbacks/components/FeedbackStatusCommentModalProvider';
import { PinnedHeader } from '@/shared/components/pinned-header';
import {
  FEEDBACK_STATUSES,
  type FeedbackStatusEnum,
  FeedbackStatusEnumMessages,
} from '@/shared/enums/feedback-status.enum';
import { useBreadcrumbRoot } from '@/shared/hooks/useBreadcrumbRoot';
import { Breadcrumb } from '@/shared/ui/Breadcrumb';
import {
  DataTable,
  DataTableCount,
  DataTableFilters,
  rowCell,
  useDataTableUrlState,
} from '@/shared/ui/data-table';
import type { ListedFeedbacksDto } from '@api/types';
import { type FeedbacksSorting, useInfiniteFeedbacksQuery } from '@queries/feedbacks.queries';

type ListedFeedback = ListedFeedbacksDto['items'][number];

const h = createColumnHelper<ListedFeedback>();

const sentAtCell = rowCell<ListedFeedback>((feedback) => (
  <FormattedDate format="zonedDateShort" value={feedback.sentAt} />
));

const authorCell = rowCell<ListedFeedback>((feedback) => (
  <div className="flex flex-col">
    {feedback.author?.name}
    {feedback.impersonated && (
      <span className="text-xs text-(--text-mention-grey)">
        <FormattedMessage
          defaultMessage="Envoyé en tant que {name}"
          values={{ name: feedback.impersonated.name }}
        />
      </span>
    )}
  </div>
));

const textCell = rowCell<ListedFeedback>((feedback) => (
  <div className="wrap-break-word whitespace-pre-line">{feedback.text}</div>
));

// a flex item would turn the link into a block, underlined under its last line only
const urlCell = rowCell<ListedFeedback>((feedback) => (
  <div className="break-all">
    {feedback.openAs ? (
      <FeedbackOpenAsLink account={feedback.openAs} url={feedback.url} />
    ) : (
      <Link
        className="box-decoration-clone after:hidden!"
        rel="noopener noreferrer"
        target="_blank"
        to={feedback.url}
      >
        {feedback.url}
        <span className="fr-sr-only">
          <FormattedMessage defaultMessage="(nouvel onglet)" />
        </span>
      </Link>
    )}
  </div>
));

const statusCell = rowCell<ListedFeedback>((feedback) => <FeedbackStatusCell feedback={feedback} />);

function useFeedbackColumns() {
  const { formatMessage } = useIntl();

  return useMemo(
    () => [
      h.accessor('sentAt', {
        cell: sentAtCell,
        enableSorting: true,
        header: formatMessage({ defaultMessage: 'Envoyé le' }),
        id: 'sentAt',
        size: 110,
      }),
      h.display({
        cell: authorCell,
        enableSorting: false,
        header: formatMessage({ defaultMessage: 'Personne' }),
        id: 'author',
        size: 210,
      }),
      h.display({
        cell: textCell,
        enableSorting: false,
        header: formatMessage({ defaultMessage: 'Retour' }),
        id: 'text',
        size: 450,
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
            values: FEEDBACK_STATUSES.map((id) => ({
              id,
              label: formatMessage(FeedbackStatusEnumMessages[id]),
            })),
          },
        },
        size: 170,
      }),
    ],
    [formatMessage],
  );
}

export function AdminFeedbacksPage() {
  const { formatMessage } = useIntl();
  const breadcrumbRoot = useBreadcrumbRoot();
  const { onColumnFiltersChange, onSortingChange, tableState } = useDataTableUrlState({
    columnFilters: [] as { id: 'status'; value: FeedbackStatusEnum[] }[],
    sorting: [] as FeedbacksSorting,
  });
  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading } = useInfiniteFeedbacksQuery({
    filters: { statuses: tableState.columnFilters.find(({ id }) => id === 'status')?.value },
    sorting: tableState.sorting,
  });

  const fetchMore = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) void fetchNextPage();
  }, [fetchNextPage, hasNextPage, isFetchingNextPage]);

  const columns = useFeedbackColumns();
  const isFiltered = tableState.columnFilters.some(({ value }) => value.length > 0);

  const feedbacks = useMemo(() => data?.items ?? [], [data]);
  const table = useReactTable({
    columns,
    data: feedbacks,
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
          currentPageLabel: formatMessage({ defaultMessage: 'Traiter les retours utilisateurs' }),
          segments: breadcrumbRoot,
        }}
        id="administration-breadcrumb"
      />

      <PinnedHeader
        bar={(isPinned) => (
          <div className={clsx('flex flex-col gap-y-6', { 'fr-container': isPinned })}>
            <div className="flex items-center justify-between gap-4">
              <h1 className="fr-h3 fr-mb-0">
                <FormattedMessage defaultMessage="Traiter les retours utilisateurs" />
                {data && <DataTableCount loaded={feedbacks.length} total={data.totalCount} />}
              </h1>
            </div>
            <DataTableFilters table={table} />
          </div>
        )}
        contentClassName="flex flex-col gap-y-6"
        pinnedBarClassName="fr-pt-6v"
      >
        <FeedbackStatusCommentModalProvider>
          <DataTable
            ariaLabel={formatMessage({ defaultMessage: 'Liste des retours' })}
            emptyLabel={
              isFiltered
                ? formatMessage({ defaultMessage: 'Aucun retour ne correspond aux filtres fournis' })
                : formatMessage({ defaultMessage: 'Aucun retour' })
            }
            fluid
            isLoading={isLoading}
            onEndReached={fetchMore}
            scrollsWithPage
            table={table}
          />
        </FeedbackStatusCommentModalProvider>
      </PinnedHeader>
    </div>
  );
}
