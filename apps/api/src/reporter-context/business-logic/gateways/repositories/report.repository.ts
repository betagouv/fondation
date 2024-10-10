import { NominationFileReport } from '../../models/nomination-file-report';

export interface ReportRepository {
  byId(id: string): Promise<NominationFileReport | null>;
  save(report: NominationFileReport): Promise<void>;
}
