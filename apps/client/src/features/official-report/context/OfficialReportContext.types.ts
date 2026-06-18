import type { FormationEnum } from '@/types/enums.types';
import type { PlainDateOnly } from '@/utils/date-only.util';
import type { TimeOnly } from '@/utils/time-only.util';

export type OfficialReport = {
  sessionMeetingDate: PlainDateOnly;
  sessionMeetingStartingTime: TimeOnly;
  sessionMeetingEndingTime: TimeOnly;
  hasRenunciation: boolean;
  justiceContactId: string;
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
  submit(form: OfficialReport): Promise<void>;
  cancel(): void;
};
