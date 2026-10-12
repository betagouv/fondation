import type { JobStatusEnum } from '@/shared/enums/job-status.enum';

export type JobsPageOutletContextType = {
  status: JobStatusEnum | undefined;
};
