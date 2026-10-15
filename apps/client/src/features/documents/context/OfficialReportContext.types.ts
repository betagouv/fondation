import type { SystemUpdateCause } from '@/features/documents/hooks/useSystemUpdateCauses';
import type { FormationEnum } from '@/shared/enums/formation.enum';
import type { PlainDateOnly } from '@/utils/date-only.util';
import type { PlainTimeOnly } from '@/utils/time-only.util';

export type OfficialReport = {
  sessionMeetingDate: PlainDateOnly;
  sessionMeetingStartingTime: PlainTimeOnly;
  sessionMeetingEndingTime: PlainTimeOnly;
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
  /** what a validated report did not follow: saving it again, even unchanged, is how it catches up */
  changedSinceValidation: readonly SystemUpdateCause[];
  isSubmitting: boolean;
  submit(form: OfficialReport): Promise<void>;
  cancel(): void;
};
