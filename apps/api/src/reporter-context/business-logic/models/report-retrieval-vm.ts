import { NominationFileRules } from './report-rules';

export interface ReportRetrievalVM {
  id: string;
  title: string;
  biography: string;
  dueDate: string | null;
  rules: NominationFileRules;
}
