import { Injectable } from '@nestjs/common';
import type { Prisma } from 'src/generated/prisma/client';
import { ChildProcessJobRunner } from './child-process-job-runner';
import { ScalingoJobRunner } from './scalingo-job-runner';

/** higher level job runner */
@Injectable()
export class JobRunner {
  constructor(
    private readonly scalingo: ScalingoJobRunner,
    private readonly childProcess: ChildProcessJobRunner,
  ) {}

  runDetached(jobId: number): Promise<{ toJSON(): Prisma.InputJsonValue }> {
    if (!this.scalingo.isAvailable) {
      return this.childProcess.runDetached(jobId);
    }

    /**
     * @warning ATM this is a branch that can't be tested outside of the
     * release environment, and should be treated with caution
     */
    return this.scalingo.runDetached(jobId);
  }
}
