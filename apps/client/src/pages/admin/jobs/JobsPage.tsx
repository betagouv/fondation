import DocumentSearch from '@codegouvfr/react-dsfr/picto/DocumentSearch';
import { SideMenu } from '@codegouvfr/react-dsfr/SideMenu';
import { Tag } from '@codegouvfr/react-dsfr/Tag';
import { parseAsArrayOf, parseAsStringEnum, useQueryState } from 'nuqs';
import { useCallback, useMemo } from 'react';
import { Navigate, Outlet, generatePath, useParams } from 'react-router';

import { ROUTE_PATHS } from '@/utils/route-path.utils';
import { useListJobsInfiniteQuery } from '@queries/jobs.queries';

import { JobStatusEnum, JobStatusEnumLabel } from '@/types/enums.types';
import Button from '@codegouvfr/react-dsfr/Button';
import { JOB_STATUS_ICONS } from './common/job-status.utils';
import { JobsListItem } from './components/JobsListItem';
import { SelectedJobProvider } from './contexts';

export function JobsPage() {
  const params = useParams();
  const [statusFilter, setStatusFilter] = useQueryState(
    'status',
    parseAsArrayOf(parseAsStringEnum(Object.values(JobStatusEnum))).withDefault([])
  );

  const { data, error, isLoading, isFetched, isFetching, isError, hasNextPage, fetchNextPage } =
    useListJobsInfiniteQuery({
      statuses: statusFilter
    });

  const hasData = isFetched && (data?.pages[0]?.items.length ?? 0) > 0;

  const toggleStatus = useCallback(
    (status: JobStatusEnum) => {
      setStatusFilter((statuses) => {
        if (statuses.includes(status)) return statuses.filter((x) => x !== status);
        return statuses.concat(status);
      });
    },
    [setStatusFilter]
  );

  const statuses = [
    JobStatusEnum.FAILED,
    JobStatusEnum.RUNNING,
    JobStatusEnum.IDLE,
    JobStatusEnum.CANCELED,
    JobStatusEnum.SUCCEEDED
  ];

  const activeItem = useMemo(() => {
    if (!params.jobId) return undefined;

    for (const page of data?.pages ?? []) {
      const item = (page?.items ?? []).find((job) => String(job.id) === params.jobId);
      if (item) return item;
    }
  }, [data, params]);

  const activeBgClass = useMemo(() => {
    if (!activeItem) return undefined;
    return JOB_STATUS_ICONS[activeItem.status].beforeBgColor;
  }, [activeItem]);

  if (hasData && !params.jobId) {
    return (
      <Navigate
        replace
        to={generatePath(ROUTE_PATHS.ADMIN.DETAILS_JOB, { jobId: String(data?.pages[0]?.items[0]?.id) })}
      />
    );
  }

  return (
    <div className="mx-4 flex min-h-full flex-col p-4 md:mx-0 md:flex-row">
      <SideMenu
        sticky
        className="md:w-80"
        classes={{
          list: 'max-h-[53vh] min-h-full overflow-y-scroll pb-20',
          link: activeBgClass
        }}
        title={
          <>
            <h2>Ingestions</h2>
            <div className="flex flex-nowrap gap-x-2 overflow-x-scroll pb-4 pt-2">
              {statuses.map((s) => (
                <Tag
                  small
                  key={s}
                  pressed={statusFilter.includes(s)}
                  className="flex-shrink-0 flex-grow-0 text-nowrap"
                  nativeButtonProps={{ onClick: () => toggleStatus(s) }}
                >
                  {JobStatusEnumLabel[s]}
                </Tag>
              ))}
            </div>
          </>
        }
        burgerMenuButtonText="Ingestion"
        items={
          isLoading || isError
            ? [
                {
                  linkProps: { to: '#' },
                  isActive: false,
                  text: isLoading ? (
                    <p className="m-0 text-sm font-normal">Chargement...</p>
                  ) : (
                    <div>
                      <p className="m-0 font-normal text-red-500">Erreur</p>
                      {error ? <p className="m-0 text-xs font-normal text-red-500">{String(error)}</p> : null}
                    </div>
                  )
                }
              ]
            : !hasData
              ? [
                  {
                    linkProps: { to: '' },
                    isActive: false,
                    text: (
                      <p className="m-0 text-sm font-normal text-gray-500">
                        Aucune ingestion ne correspond aux filtres
                      </p>
                    )
                  }
                ]
              : (data?.pages ?? [])
                  .flatMap((page) =>
                    (page?.items ?? []).map((job) => ({
                      text: <JobsListItem key={job.id} job={job} />,
                      isActive: params.jobId === String(job.id),
                      linkProps: {
                        to: generatePath(ROUTE_PATHS.ADMIN.DETAILS_JOB, { jobId: String(job.id) })
                      }
                    }))
                  )
                  .concat(
                    isFetched && hasNextPage
                      ? [
                          {
                            linkProps: {
                              to: '#',
                              // eslint-disable-next-line
                              // @ts-ignore
                              onClick: (e) => {
                                e.preventDefault();

                                fetchNextPage();
                              }
                            },
                            isActive: false,
                            text: <Button priority="primary">Charger plus</Button>
                          }
                        ]
                      : []
                  )
        }
      />
      <div className="min-h-full w-[calc(100vw-24rem)] overflow-y-auto">
        {hasData || isFetching || params.jobId ? (
          <SelectedJobProvider>
            <Outlet context={{ status: activeItem?.status }} />
          </SelectedJobProvider>
        ) : (
          <div className="flex h-full w-full flex-col items-center justify-center">
            <DocumentSearch className="size-44" />
            <h3 className="fr-h4">Aucune ingestion n'est disponible pour le moment</h3>
          </div>
        )}
      </div>
    </div>
  );
}
