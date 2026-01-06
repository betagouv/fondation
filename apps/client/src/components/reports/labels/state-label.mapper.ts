import type { ReportStatusEnum } from '@/types/enums.types';

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
    default: {
      const _exhaustiveCheck: never = state;
      console.info(_exhaustiveCheck);
      throw new Error(`Unhandled state: ${JSON.stringify(state)}`);
    }
  }
};
