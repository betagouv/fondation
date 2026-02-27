import type { JobStatusEnum } from '@/types/enums.types';

export type JobsPageOutletContextType = {
  status: JobStatusEnum | undefined;
};
