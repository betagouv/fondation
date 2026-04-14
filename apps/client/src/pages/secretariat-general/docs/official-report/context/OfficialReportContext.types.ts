import type { FormationEnum } from '@/types/enums.types';
import type { DateOnlyJson } from 'shared-models';

export type OfficialReportStep = {
  index: 1 | 2;
  title: string;
  nextTitle?: string;
};

export type OfficialReportMetadata = {
  sessionMeetingDate: DateOnlyJson;
  sessionMeetingTime: string;
  hasRenunciation: boolean;
  justiceDepartmentContactId: number;
  chairmanId: string;
  secretaryId: string;
  memberIds: string[];
};

export type OfficialReportContextType = {
  step: OfficialReportStep;
  session: { id: string; formation: FormationEnum };
  metadata: OfficialReportMetadata | null;
  isSubmitting: boolean;
  goToSelections(values: OfficialReportMetadata): void;
  goToMetadata(): void;
  submit(agendaIds: string[]): void;
  cancel(): void;
};
