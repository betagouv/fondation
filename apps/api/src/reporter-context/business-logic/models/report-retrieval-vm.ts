import { NominationFileRules } from './nomination-file-report';

export interface ReportRetrievalVM {
  id: string;
  title: string;
  biography: string;
  dueDate: string | null;
  rules: { management: NominationFileRules };
}
