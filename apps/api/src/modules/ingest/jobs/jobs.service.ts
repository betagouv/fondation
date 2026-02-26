import { Injectable } from '@nestjs/common';
import { Pagination } from 'src/modules/framework/pagination';
import { DetailedJobDto, DetailsJobQuery } from './queries/details-job.query';
import { ListJobsQuery, PaginatedJobsDto } from './queries/list-jobs.query';

@Injectable()
export class JobsService {
  constructor(
    private readonly listJobsQuery: ListJobsQuery,
    private readonly detailsJobQuery: DetailsJobQuery,
  ) {}

  listJobs(query: {
    pagination: Pagination;
    statuses: ('SUCCEEDED' | 'FAILED' | 'RUNNING' | 'IDLE' | 'CANCELED')[];
  }): Promise<PaginatedJobsDto> {
    return this.listJobsQuery.handle(query);
  }

  detailsJob(query: { jobId: number }): Promise<DetailedJobDto> {
    return this.detailsJobQuery.handle(query);
  }
}
