import type { PlainDateOnly } from '@/models/date-only.model';
import type { FormationEnum } from '@/types/enums.types';

export type AgendaStep = {
  index: 1 | 2;
  title: string;
  nextTitle?: string;
};

export type AgendaMetadata = {
  sessionMeetingDate: PlainDateOnly;
  date: PlainDateOnly;
  chairmanId: string;
};

export type AgendaContextType = {
  step: AgendaStep;
  agendaId: string | null;
  session: { id: string; dueDate: PlainDateOnly | null; formation: FormationEnum };
  metadata: AgendaMetadata | null;
  isSubmitting: boolean;
  goToNominationFiles(values: AgendaMetadata): void;
  goToMetadata(): void;
  submit(nominationFileIds: string[]): unknown;
  cancel(): void;
};
