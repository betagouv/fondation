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
  justiceDepartmentContactId: string;
  chairmanId: string;
  secretaryId: string;
  memberIds: string[];
};

export type OfficialReportContextType = {
  step: OfficialReportStep;
  officialReportId: string | null;
  session: { id: string; formation: FormationEnum };
  metadata: OfficialReportMetadata | null;
  agendaIds: string[] | undefined;
  isSubmitting: boolean;
  goToSelections(values: OfficialReportMetadata): void;
  goToMetadata(): void;
  submit(agendaIds: string[]): void;
  cancel(): void;
};
