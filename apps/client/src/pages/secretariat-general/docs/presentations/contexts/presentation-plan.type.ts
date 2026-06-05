import type { FormationEnum } from '@/types/enums.types';

export type PresentationPlanContextType = {
  planId: string | null;
  isFetching: boolean;
  isDisabled: boolean;
  state: {
    step: 'METADATA' | 'AGENDA_COMMENTS';
    formation: FormationEnum | null;
    agendas: Record<string, string | null>;
    chairmanId: string | null;
    secretaryId: string | null;
    justiceContactId: string | null;
    date: { day: number; month: number; year: number } | null;
    time: { hours: number; minutes: number } | null;
    absentMemberIds: string[];
    hasRenunciation: boolean;
  };

  goToMetadata(): void;
  createPlan(options: { agendas: Record<string, string | null> }): Promise<void>;
  initPlanCreation(options: { agendaIds: string[]; formation: 'PARQUET' | 'SIEGE' }): void;
  setMetadata(options: {
    chairmanId: string;
    secretaryId: string;
    justiceContactId: string;
    date: { day: number; month: number; year: number };
    time: { hours: number; minutes: number };
    absentMemberIds: readonly string[];
    hasRenunciation: boolean;
  }): void;
};
