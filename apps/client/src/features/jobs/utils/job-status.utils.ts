import type { JobStatusEnum } from '@/types/enums.types';

export const JOB_STATUS_ICONS = {
  IDLE: {
    icon: 'ri-time-line',
    textColor: 'text-(--text-mention-grey)',
    beforeBgColor: 'before:bg-(--background-action-high-grey)!',
  },
  RUNNING: {
    icon: 'ri-loader-2-line animate-spin',
    textColor: 'text-(--text-action-high-blue-france)',
    beforeBgColor: 'before:bg-(--background-action-high-blue-france)!',
  },
  FAILED: {
    icon: 'ri-close-circle-fill',
    textColor: 'text-(--text-default-error)',
    beforeBgColor: 'before:bg-(--background-flat-error)!',
  },
  SUCCEEDED: {
    icon: 'ri-checkbox-circle-fill',
    textColor: 'text-(--text-default-success)',
    beforeBgColor: 'before:bg-(--background-flat-success)!',
  },
  CANCELED: {
    icon: 'ri-spam-2-fill',
    textColor: 'text-(--text-mention-grey)',
    beforeBgColor: 'before:bg-(--background-action-high-grey)!',
  },
  WARNING: {
    icon: 'ri-error-warning-fill',
    textColor: 'text-(--text-default-warning)',
    beforeBgColor: 'before:bg-(--background-flat-warning)!',
  },
} as const satisfies Record<
  JobStatusEnum | 'WARNING',
  { icon: string; textColor: string; beforeBgColor: string }
>;
