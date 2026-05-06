import type { JobStatusEnum } from '@/types/enums.types';

export const JOB_STATUS_ICONS = {
  IDLE: {
    icon: 'ri-time-line',
    textColor: 'text-gray-500',
    beforeBgColor: 'before:!bg-gray-500',
  },
  RUNNING: {
    icon: 'ri-loader-2-line animate-spin',
    textColor: 'text-blue-500',
    beforeBgColor: 'before:!bg-blue-500',
  },
  FAILED: {
    icon: 'ri-close-circle-fill',
    textColor: 'text-red-600',
    beforeBgColor: 'before:!bg-red-600',
  },
  SUCCEEDED: {
    icon: 'ri-checkbox-circle-fill',
    textColor: 'text-green-600',
    beforeBgColor: 'before:!bg-green-600',
  },
  CANCELED: {
    icon: 'ri-spam-2-fill',
    textColor: 'text-gray-600',
    beforeBgColor: 'before:!bg-gray-600',
  },
  WARNING: {
    icon: 'ri-error-warning-fill',
    textColor: 'text-orange-600',
    beforeBgColor: 'before:!bg-orange-600',
  },
} as const satisfies Record<
  JobStatusEnum | 'WARNING',
  { icon: string; textColor: string; beforeBgColor: string }
>;
