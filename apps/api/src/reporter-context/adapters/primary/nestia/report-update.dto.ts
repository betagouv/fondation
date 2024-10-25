import { NominationFile } from 'shared-models';

export interface ReportUpdateDto {
  state?: NominationFile.ReportState;
  comment?: string;
}
