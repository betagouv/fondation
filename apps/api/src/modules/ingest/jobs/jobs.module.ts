import { Module } from '@nestjs/common';
import { ChildProcessJobRunner } from './child-process-job-runner';
import { JobRunner } from './job-runner';
import { ScalingoJobRunner } from './scalingo-job-runner';

@Module({
  providers: [ScalingoJobRunner, ChildProcessJobRunner, JobRunner],
  exports: [JobRunner],
})
export class JobsModule {}
