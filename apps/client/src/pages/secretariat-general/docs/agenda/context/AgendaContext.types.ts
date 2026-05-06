import type { DateOnlyJson } from 'shared-models';

import type { FormationEnum } from '@/types/enums.types';

export type AgendaStep = {
  index: 1 | 2;
  title: string;
  nextTitle?: string;
};

export type AgendaMetadata = {
  sessionMeetingDate: DateOnlyJson;
  date: DateOnlyJson;
  chairmanId: string;
};

export type AgendaContextType = {
  step: AgendaStep;
  agendaId: string | null;
  session: { id: string; dueDate: DateOnlyJson | null; formation: FormationEnum };
  metadata: AgendaMetadata | null;
  isSubmitting: boolean;
  goToNominationFiles(values: AgendaMetadata): void;
  goToMetadata(): void;
  submit(nominationFileIds: string[]): unknown;
  cancel(): void;
};
