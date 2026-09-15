import { useInfiniteQuery, useQuery } from '@tanstack/react-query';

import type { JobStatusEnum } from '@/shared/enums/job-status.enum';
import * as $api from '@api/sdk';

const jobKeys = {
  listJobs: (props: { statuses?: JobStatusEnum[]; limit?: number } = {}) =>
    [`jobs`, `listJobs`, props] as const,
  detailsJob: (props: { jobId: number }) => [`jobs`, `detailsJob`, props.jobId] as const,
};

export const useListJobsInfiniteQuery = (
  props: {
    statuses?: JobStatusEnum[];
    pagination?: { perPage: number };
  } = {},
) =>
  useInfiniteQuery({
    queryKey: jobKeys.listJobs({
      statuses: props.statuses,
      limit: props.pagination?.perPage,
    }),
    queryFn: ({ pageParam }) =>
      $api.jobs
        .listJobs({
          query: {
            page: pageParam,
            limit: props.pagination?.perPage,
            statuses: props.statuses,
          },
        })
        .then(({ data }) => data ?? null),

    initialPageParam: 1,
    getNextPageParam: (page) => page?.nextPageIndex,
  });

export const useDetailsJobQuery = (props: { jobId: number }) =>
  useQuery({
    enabled: Number.isFinite(props.jobId),
    queryKey: jobKeys.detailsJob(props),
    queryFn: () => $api.jobs.detailsJob({ path: { jobId: props.jobId } }).then(({ data }) => data ?? null),
  });
