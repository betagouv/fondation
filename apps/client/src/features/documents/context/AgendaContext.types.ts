import type { SessionOutcome } from '@/features/nomination-files-table/context/files-table.context';
import type { FormationEnum } from '@/types/enums.types';
import type { PlainDateOnly } from '@/utils/date-only.util';

export type AgendaStep = {
  index: 1 | 2;
  title: string;
};

export type AgendaMetadata = {
  chairmanId: string;
  date: PlainDateOnly;
  sessionMeetingDate: PlainDateOnly;
};

export type AgendaContextType = {
  error: string | null;
  isSubmitting: boolean;
  metadata: AgendaMetadata | null;
  session: {
    dueDate: PlainDateOnly | null;
    formation: FormationEnum;
    id: string;
    outcomes: readonly SessionOutcome[];
  };
  step: AgendaStep;
  cancel(): void;
  goToFiles(metadata: AgendaMetadata): void;
  goToMetadata(): void;
  submit(nominationFileIds: readonly string[]): unknown;
};
