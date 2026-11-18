import { createColumnHelper, getCoreRowModel, useReactTable } from '@tanstack/react-table';
import clsx from 'clsx';
import { useCallback, useMemo, useState } from 'react';
import { defineMessages, FormattedDate, FormattedMessage, useIntl } from 'react-intl';
import { Link, Navigate, useParams } from 'react-router';

import { FeedbackOpenAsLink } from '@/features/feedbacks/components/FeedbackOpenAsLink';
import { FEEDBACK_STATUS_BADGE_COLORS } from '@/features/feedbacks/components/FeedbackStatusBadge';
import { FeedbackStatusCell } from '@/features/feedbacks/components/FeedbackStatusCell';
import { FeedbackStatusCommentModalProvider } from '@/features/feedbacks/components/FeedbackStatusCommentModalProvider';
import { PinnedHeader } from '@/shared/components/pinned-header';
import {
  FEEDBACK_AGES,
  type FeedbackAgeEnum,
  FeedbackAgeEnumMessages,
} from '@/shared/enums/feedback-age.enum';
import { FEEDBACK_STATUSES, type FeedbackStatusEnum } from '@/shared/enums/feedback-status.enum';
import { useBreadcrumbRoot } from '@/shared/hooks/useBreadcrumbRoot';
import { Breadcrumb } from '@/shared/ui/Breadcrumb';
import {
  DataTable,
  DataTableCount,
  DataTableFilters,
  loadFailureOf,
  rowCell,
  useDataTableSearch,
  useDataTableUrlState,
} from '@/shared/ui/data-table';
import { AttachedLinkTab, AttachedLinkTabs } from '@/shared/ui/link-tabs';
import { SearchInput } from '@/shared/ui/search-input';
import { knownValues } from '@/utils/known-values.utils';
import type { ListedFeedbacksDto } from '@api/types';
import { type FeedbacksSorting, useInfiniteFeedbacksQuery } from '@queries/feedbacks.queries';

import { feedbackStatusOf, feedbackStatusPath } from './feedback-status-paths';

type ListedFeedback = ListedFeedbacksDto['items'][number];

const TAB_LABELS = defineMessages({
  ACKNOWLEDGED: { defaultMessage: 'Pris en compte' },
  DISMISSED: { defaultMessage: 'Écartés' },
  NEW: { defaultMessage: 'Nouveaux' },
  PROCESSED: { defaultMessage: 'Traités' },
} satisfies Record<FeedbackStatusEnum, { defaultMessage: string }>);

const EMPTY_LABELS = defineMessages({
  ACKNOWLEDGED: { defaultMessage: 'Aucun retour pris en compte' },
  DISMISSED: { defaultMessage: 'Aucun retour écarté' },
  NEW: { defaultMessage: 'Aucun nouveau retour' },
  PROCESSED: { defaultMessage: 'Aucun retour traité' },
} satisfies Record<FeedbackStatusEnum, { defaultMessage: string }>);

const KNOWN_AGES: Record<FeedbackAgeEnum, true> = {
  MORE_THAN_14_DAYS: true,
  MORE_THAN_1_MONTH: true,
  MORE_THAN_21_DAYS: true,
  MORE_THAN_2_MONTHS: true,
  MORE_THAN_7_DAYS: true,
};
const NEWEST_FIRST: FeedbacksSorting = [{ desc: true, id: 'sentAt' }];
const SORTABLE_COLUMNS = new Set<string>(['sentAt']);

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
        meta: {
          filters: {
            filterId: 'sentAgo',
            label: formatMessage({ defaultMessage: 'Envoyé il y a' }),
            multiple: false,
            type: 'enum',
            values: FEEDBACK_AGES.map((id) => ({ id, label: formatMessage(FeedbackAgeEnumMessages[id]) })),
          },
        },
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
        enableSorting: false,
        header: formatMessage({ defaultMessage: 'Statut' }),
        id: 'status',
        size: 170,
      }),
    ],
    [formatMessage],
  );
}

function FeedbackStatusTab(props: { count: number | undefined; status: FeedbackStatusEnum }) {
  const { formatMessage } = useIntl();

  return (
    <AttachedLinkTab
      count={props.count}
      countClassName={FEEDBACK_STATUS_BADGE_COLORS[props.status]}
      keepsQuery
      label={formatMessage(TAB_LABELS[props.status])}
      to={feedbackStatusPath(props.status)}
    />
  );
}

export function AdminFeedbacksPage() {
  const status = feedbackStatusOf(useParams().status);

  if (!status) return <Navigate replace to={feedbackStatusPath('NEW')} />;

  return <AdminFeedbacksOfStatus status={status} />;
}

function AdminFeedbacksOfStatus(props: { status: FeedbackStatusEnum }) {
  const { formatMessage } = useIntl();
  const breadcrumbRoot = useBreadcrumbRoot();
  const { onColumnFiltersChange, onSortingChange, setTableState, tableState } = useDataTableUrlState({
    columnFilters: [] as { id: 'sentAgo'; value: FeedbackAgeEnum[] }[],
    globalFilter: '',
    sorting: NEWEST_FIRST,
  });
  const filters = {
    search: tableState.globalFilter,
    sentAgo: knownValues(tableState.columnFilters.find(({ id }) => id === 'sentAgo')?.value, KNOWN_AGES)[0],
  };
  const isFiltered = !!filters.search || !!filters.sentAgo;
  const [sort] = tableState.sorting;
  const sorting = sort && SORTABLE_COLUMNS.has(sort.id) ? tableState.sorting : NEWEST_FIRST;
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isError,
    isFetching,
    isFetchingNextPage,
    isFetchNextPageError,
    isLoading,
    isPlaceholderData,
    refetch,
  } = useInfiniteFeedbacksQuery({
    filters: { ...filters, statuses: [props.status] },
    sorting,
  });

  // the rows of the previous tab stay as placeholder until those of the new one arrive
  const [loadedStatus, setLoadedStatus] = useState(props.status);
  if (!isPlaceholderData && loadedStatus !== props.status) setLoadedStatus(props.status);
  const listed = loadedStatus === props.status ? data : undefined;

  const search = useDataTableSearch(tableState.globalFilter, (globalFilter) =>
    setTableState((state) => ({ ...state, globalFilter })),
  );

  const fetchMore = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage && !isFetchNextPageError) void fetchNextPage();
  }, [fetchNextPage, hasNextPage, isFetchingNextPage, isFetchNextPageError]);

  const columns = useFeedbackColumns();

  const feedbacks = useMemo(() => listed?.items ?? [], [listed]);
  const table = useReactTable({
    columns,
    data: feedbacks,
    enableSortingRemoval: false,
    getCoreRowModel: getCoreRowModel(),
    getRowId: (row) => row.id,
    manualFiltering: true,
    manualSorting: true,
    onColumnFiltersChange,
    onSortingChange,
    state: {
      columnFilters: tableState.columnFilters,
      globalFilter: tableState.globalFilter,
      sorting,
    },
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
          <div className={clsx('flex flex-col gap-y-4', { 'fr-container': isPinned })}>
            <h1 className="fr-h3 fr-mb-0">
              <FormattedMessage defaultMessage="Traiter les retours utilisateurs" />
              {listed && <DataTableCount loaded={feedbacks.length} total={listed.totalCount} />}
            </h1>
            <div className="flex items-center justify-between gap-4">
              <DataTableFilters table={table} />
              <SearchInput
                className="w-96"
                onChange={search.onChange}
                onClear={search.clear}
                placeholder={formatMessage({ defaultMessage: 'Rechercher un retour ou une personne' })}
                value={search.value}
              />
            </div>
          </div>
        )}
        contentClassName="flex flex-col"
        pinnedBarClassName="fr-pt-6v"
      >
        <AttachedLinkTabs ariaLabel={formatMessage({ defaultMessage: 'Retours par statut' })}>
          {FEEDBACK_STATUSES.map((status) => (
            <FeedbackStatusTab
              count={data?.statuses.find(({ id }) => id === status)?.count}
              key={status}
              status={status}
            />
          ))}
        </AttachedLinkTabs>
        <FeedbackStatusCommentModalProvider>
          <DataTable
            ariaLabel={formatMessage(
              { defaultMessage: 'Retours : {status}' },
              { status: formatMessage(TAB_LABELS[props.status]) },
            )}
            emptyLabel={
              isFiltered
                ? formatMessage({ defaultMessage: 'Aucun retour ne correspond aux filtres fournis' })
                : formatMessage(EMPTY_LABELS[props.status])
            }
            fluid
            isLoading={!isError && (isLoading || !listed)}
            loadError={loadFailureOf({ fetchNextPage, isError, isFetching, isFetchNextPageError, refetch })}
            onEndReached={fetchMore}
            scrollsWithPage
            table={table}
          />
        </FeedbackStatusCommentModalProvider>
      </PinnedHeader>
    </div>
  );
}
