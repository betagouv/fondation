import type { DetailedJobDto } from '@api/types';

export type JobFile = DetailedJobDto['files'][number];
export type Tree = Omit<JobFile, 'requirements'> & {
  children: Tree[];
  size: number;
};
