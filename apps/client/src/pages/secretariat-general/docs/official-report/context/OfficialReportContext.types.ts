import type { FormationEnum } from '@/types/enums.types';
import type { PlainDateOnly } from '@/utils/date-only.util';

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
