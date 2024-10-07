import { NominationFileReport } from '../../models/NominationFileReport';

export interface NominationFileReportRepository {
  byId(id: string): Promise<NominationFileReport>;
  save(report: NominationFileReport): Promise<void>;
}
