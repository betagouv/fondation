import type { ReportStatusEnum } from '@/types/enums.types';
import { assertNever } from '@/utils/types.util';

export const stateToLabel = (state: ReportStatusEnum) => {
  switch (state) {
    case 'NEW':
      return 'Nouveau';
    case 'IN_PROGRESS':
      return 'En cours';
    case 'READY_TO_SUPPORT':
      return 'Prêt à soutenir';
    case 'SUPPORTED':
      return 'Soutenu';
    default:
      return assertNever(state);
  }
};
