import { Module } from '@nestjs/common';
import { JobsController } from './jobs.controller';
import { JobsService } from './jobs.service';
import { DetailsJobQuery } from './queries/details-job.query';
import { ListJobsQuery } from './queries/list-jobs.query';
import { ChildProcessJobRunner } from './runner/child-process-job-runner';
import { JobRunner } from './runner/job-runner';
import { ScalingoJobRunner } from './runner/scalingo-job-runner';

@Module({
  controllers: [JobsController],
  providers: [
    ScalingoJobRunner,
    ChildProcessJobRunner,
    JobRunner,
    JobsService,
    ListJobsQuery,
    DetailsJobQuery,
  ],
  exports: [JobRunner],
})
export class JobsModule {}
