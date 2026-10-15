import Button from '@codegouvfr/react-dsfr/Button';
import { createColumnHelper, getCoreRowModel, useReactTable, type CellContext } from '@tanstack/react-table';
import clsx from 'clsx';
import { useCallback, useEffect, useMemo, useRef } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';
import { generatePath, Link, Outlet, useNavigate, useParams } from 'react-router';

import { JobStatusBadge } from '@/features/jobs/components/JobStatusBadge';
import { SelectedJobProvider } from '@/features/jobs/context';
import { formatJobDuration } from '@/features/jobs/utils/format-job-duration.utils';
import { PinnedHeader } from '@/shared/components/pinned-header';
import { JobStatusEnum, JobStatusEnumMessages } from '@/shared/enums/job-status.enum';
import { useDateAndTime } from '@/shared/hooks/useDateAndTime';
import { Breadcrumb } from '@/shared/ui/Breadcrumb';
import {
  DataTable,
  DataTableCount,
  DataTableFilters,
  rowCell,
  useDataTableUrlState,
} from '@/shared/ui/data-table';
import { SidePanel } from '@/shared/ui/side-panel';
import { ROUTE_PATHS } from '@/utils/route-path.utils';
import { capitalize } from '@/utils/string.utils';
import type { PaginatedJobsDto } from '@api/types';
import { useInfiniteJobsQuery } from '@queries/jobs.queries';

type ListedJob = PaginatedJobsDto['items'][number];

const h = createColumnHelper<ListedJob>();

const jobCell = rowCell<ListedJob>((job) => (
  <Link to={generatePath(ROUTE_PATHS.ADMIN.DETAILS_JOB, { jobId: String(job.id) })}>
    <FormattedMessage defaultMessage="Ingestion n°{id}" values={{ id: job.id }} />
  </Link>
));

function StartedAtCell(props: CellContext<ListedJob, unknown>) {
  const dateAndTime = useDateAndTime();
  const { createdAt, startedAt } = props.row.original;

  return <FormattedMessage defaultMessage="{date} à {time}" values={dateAndTime(startedAt ?? createdAt)} />;
}

const durationCell = rowCell<ListedJob>((job) => formatJobDuration(job) ?? '-');

function useJobColumns() {
  const { formatMessage } = useIntl();

  return useMemo(
    () => [
      h.accessor('id', {
        cell: jobCell,
        header: formatMessage({ defaultMessage: 'Ingestion' }),
        id: 'id',
        size: 200,
      }),

      h.accessor('status', {
        cell: ({ getValue }) => <JobStatusBadge status={getValue()} />,
        header: formatMessage({ defaultMessage: 'Statut' }),
        id: 'status',
        meta: {
          filters: {
            filterId: 'status',
            label: formatMessage({ defaultMessage: 'Statut' }),
            type: 'enum',
            values: Object.values(JobStatusEnum).map((id) => ({
              id,
              label: capitalize(formatMessage(JobStatusEnumMessages[id])),
            })),
          },
        },
        size: 160,
      }),

      h.display({
        cell: StartedAtCell,
        header: formatMessage({ defaultMessage: 'Lancée le' }),
        id: 'startedAt',
        size: 220,
      }),

      h.display({
        cell: durationCell,
        header: formatMessage({ defaultMessage: 'Durée' }),
        id: 'duration',
        size: 140,
      }),
    ],
    [formatMessage],
  );
}

export function AdminJobsPage() {
  const { formatMessage } = useIntl();
  const navigate = useNavigate();
  const { jobId } = useParams();
  const { onColumnFiltersChange, tableState } = useDataTableUrlState({
    columnFilters: [] as { id: 'status'; value: JobStatusEnum[] }[],
  });

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading } = useInfiniteJobsQuery({
    filters: { statuses: tableState.columnFilters.find(({ id }) => id === 'status')?.value },
  });

  const columns = useJobColumns();
  const isFiltered = tableState.columnFilters.some(({ value }) => value.length > 0);

  const jobs = useMemo(() => data?.items ?? [], [data]);
  const table = useReactTable({
    columns,
    data: jobs,
    enableSorting: false,
    getCoreRowModel: getCoreRowModel(),
    getRowId: (row) => String(row.id),
    manualFiltering: true,
    onColumnFiltersChange,
    state: { columnFilters: tableState.columnFilters },
  });

  const closePanel = useCallback(() => navigate(ROUTE_PATHS.ADMIN.LIST_JOBS), [navigate]);
  const openJob = useCallback(
    (job: ListedJob) => navigate(generatePath(ROUTE_PATHS.ADMIN.DETAILS_JOB, { jobId: String(job.id) })),
    [navigate],
  );

  const activeIndex = jobs.findIndex((job) => String(job.id) === jobId);
  const hasPrevious = activeIndex > 0;
  const hasNext = activeIndex !== -1 && (activeIndex < jobs.length - 1 || !!hasNextPage);
  /** "Suivant" on the last loaded row waits for the next page before it can open anything */
  const pendingNext = useRef(false);

  const previous = useCallback(() => {
    const job = jobs[activeIndex - 1];
    if (job) openJob(job);
  }, [activeIndex, jobs, openJob]);

  const next = useCallback(() => {
    const job = jobs[activeIndex + 1];
    if (job) openJob(job);
    else if (hasNextPage && !isFetchingNextPage) {
      pendingNext.current = true;
      void fetchNextPage();
    }
  }, [activeIndex, fetchNextPage, hasNextPage, isFetchingNextPage, jobs, openJob]);

  useEffect(() => {
    if (!pendingNext.current) return;
    const job = jobs[activeIndex + 1];
    if (!job) return;
    pendingNext.current = false;
    openJob(job);
  }, [activeIndex, jobs, openJob]);

  return (
    <div className="fr-container fr-pt-8v fr-pb-16v">
      <Breadcrumb
        ariaLabel={formatMessage({ defaultMessage: "Fil d'Ariane pour l'Administration" })}
        breadcrumb={{
          currentPageLabel: formatMessage({ defaultMessage: 'Ingestions' }),
          segments: [{ label: formatMessage({ defaultMessage: 'Administration' }), to: {} }],
        }}
        id="administration-breadcrumb"
      />

      <PinnedHeader
        bar={(isPinned) => (
          <div className={clsx('flex flex-col gap-y-6', { 'fr-container': isPinned })}>
            <div className="flex items-center justify-between gap-4">
              <h1 className="fr-h3 fr-mb-0">
                <FormattedMessage defaultMessage="Ingestions" />
                {data && (
                  <span className="fr-ml-2v text-sm font-normal text-(--text-mention-grey)">
                    (<DataTableCount loaded={jobs.length} total={data.totalCount} />)
                  </span>
                )}
              </h1>
              <Button
                className="btn-compact"
                iconId="fr-icon-upload-line"
                linkProps={{ to: ROUTE_PATHS.ADMIN.INGEST_LOLFI }}
                priority="secondary"
                size="small"
              >
                <FormattedMessage defaultMessage="Importer une archive" />
              </Button>
            </div>
            <DataTableFilters table={table} />
          </div>
        )}
        contentClassName="flex flex-col gap-y-6"
        pinnedBarClassName="fr-pt-6v"
      >
        <div className={clsx('w-full transition-[width] duration-300 ease-out', jobId && 'md:w-[52%]')}>
          <DataTable
            ariaLabel={formatMessage({ defaultMessage: 'Liste des ingestions' })}
            emptyLabel={
              isFiltered
                ? formatMessage({ defaultMessage: 'Aucune ingestion ne correspond aux filtres fournis' })
                : formatMessage({ defaultMessage: 'Aucune ingestion' })
            }
            fluid
            isLoading={isLoading}
            revealedRowId={jobId}
            rowTint={(row) => (row.id === jobId ? 'bg-(--background-alt-blue-france)' : undefined)}
            scrollsWithPage
            table={table}
            unvirtualized
          />
        </div>
        {hasNextPage && (
          <Button
            className="self-center"
            disabled={isFetchingNextPage}
            onClick={() => void fetchNextPage()}
            priority="secondary"
            size="small"
          >
            <FormattedMessage defaultMessage="Voir plus" />
          </Button>
        )}
      </PinnedHeader>

      <SidePanel
        ariaLabel={formatMessage({ defaultMessage: "Détail d'une ingestion" })}
        header={
          <>
            <Button
              disabled={!hasPrevious}
              iconId="fr-icon-arrow-left-s-line"
              iconPosition="left"
              onClick={previous}
              priority="tertiary no outline"
              size="small"
            >
              <FormattedMessage defaultMessage="Précédent" />
            </Button>
            <Button
              disabled={!hasNext || isFetchingNextPage}
              iconId="fr-icon-arrow-right-s-line"
              iconPosition="right"
              onClick={next}
              priority="tertiary no outline"
              size="small"
            >
              <FormattedMessage defaultMessage="Suivant" />
            </Button>
          </>
        }
        onClose={closePanel}
        open={!!jobId}
      >
        <SelectedJobProvider>
          <Outlet />
        </SelectedJobProvider>
      </SidePanel>
    </div>
  );
}
