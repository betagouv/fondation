import { useInfiniteQuery, useQuery, type InfiniteData } from '@tanstack/react-query';

import type { JobStatusEnum } from '@/shared/enums/job-status.enum';
import * as $api from '@api/sdk';
import type { PaginatedJobsDto } from '@api/types';

export type JobsFilters = { statuses?: JobStatusEnum[] };

const jobKeys = {
  detailsJob: (props: { jobId: number }) => [`jobs`, `detailsJob`, props.jobId] as const,
  listJobs: (props: { filters: JobsFilters }) => [`jobs`, `listJobs`, props] as const,
};

const JOBS_PAGE_SIZE = 50;

/** @warning must stay stable, tanstack only reuses the selection when the function identity does not change */
function selectJobs(data: InfiniteData<PaginatedJobsDto | null>) {
  return {
    items: data.pages.flatMap((page) => page?.items ?? []),
    totalCount: data.pages.at(-1)?.totalCount ?? 0,
  };
}

export const useInfiniteJobsQuery = (options: { filters: JobsFilters }) =>
  useInfiniteQuery({
    getNextPageParam: (lastPage: PaginatedJobsDto | null) => lastPage?.nextPageIndex,
    initialPageParam: 1,
    placeholderData: (previous) => previous,
    queryFn: ({ pageParam }) =>
      $api.jobs
        .listJobs({
          query: {
            limit: JOBS_PAGE_SIZE,
            page: pageParam,
            statuses: options.filters.statuses,
          },
        })
        .then(({ data }) => data ?? null),
    queryKey: jobKeys.listJobs(options),
    select: selectJobs,
  });

export const useDetailsJobQuery = (props: { jobId: number }) =>
  useQuery({
    enabled: Number.isFinite(props.jobId),
    queryFn: () => $api.jobs.detailsJob({ path: { jobId: props.jobId } }).then(({ data }) => data ?? null),
    queryKey: jobKeys.detailsJob(props),
  });
