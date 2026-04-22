import type { FormationEnum } from '@/types/enums.types';

export type PresentationPlanContextType = {
  planId: string | null;
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
  };

  goToMetadata(): void;
  createPlan(options: { agendas: Record<string, string | null> }): void;
  initPlanCreation(options: { agendaIds: string[] }): void;
  setMetadata(options: {
    chairmanId: string;
    secretaryId: string;
    justiceContactId: string;
    date: { day: number; month: number; year: number };
    time: { hours: number; minutes: number };
  }): void;
};
