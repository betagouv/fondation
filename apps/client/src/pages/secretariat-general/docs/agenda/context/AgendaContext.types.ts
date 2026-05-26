import type { FormationEnum } from '@/types/enums.types';
import type { PlainDateOnly } from '@/utils/date-only.util';

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
  defaultFileIds: readonly string[] | null;
  isSubmitting: boolean;
  goToNominationFiles(values: AgendaMetadata): void;
  goToMetadata(): void;
  submit(nominationFileIds: string[]): unknown;
  cancel(): void;
};
