import type { PlainDateOnly } from '@/models/date-only.model';
import type { FormationEnum } from '@/types/enums.types';

export type OfficialReport = {
  sessionMeetingDate: PlainDateOnly;
  sessionMeetingTime: string;
  hasRenunciation: boolean;
  justiceDepartmentContactId: string;
  chairmanId: string;
  secretaryId: string;
  memberIds: string[];
  agendaId: string;
};

export type OfficialReportContextType = {
  officialReportId: string | null;
  session: { id: string; formation: FormationEnum };
  report: OfficialReport | null;
  isSubmitting: boolean;
  submit(form: OfficialReport): void;
  cancel(): void;
};
