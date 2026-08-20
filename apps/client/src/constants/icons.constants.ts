import type { IconClassName } from '@/types/icons.types';

export const ACTION_ICONS = {
  agendaFiles: 'ri-file-copy-2-line',
  agendaMetadata: 'ri-calendar-event-line',
  delete: 'fr-icon-delete-bin-fill',
  download: 'fr-icon-download-line',
  edit: 'fr-icon-edit-fill',
} as const satisfies Record<string, IconClassName>;
