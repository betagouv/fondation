import { NominationFile } from '@/shared-models';

export interface ReportUpdateDto {
  state?: NominationFile.ReportState;
  biography?: string;
  comment?: string;
}
