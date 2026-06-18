import { parseAsStringEnum, useQueryState } from 'nuqs';

export function useReportListFocus() {
  return useQueryState('focus', parseAsStringEnum(['general', 'affectations']).withDefault('affectations'));
}
