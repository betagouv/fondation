import { ReportRepository } from 'src/reporter-context/business-logic/gateways/repositories/report.repository';
import { NominationFileReport } from 'src/reporter-context/business-logic/models/nomination-file-report';
import { TransactionableAsync } from 'src/shared-kernel/business-logic/gateways/providers/transactionPerformer';
import { QueryRunner } from 'typeorm';
import { ReportPm } from './entities/report-pm';

export class SqlNominationFileReportRepository implements ReportRepository {
  save(report: NominationFileReport): TransactionableAsync {
    return async (queryRunner: QueryRunner) => {
      await queryRunner.manager.save(ReportPm.fromDomain(report));
    };
  }

  byId(id: string): TransactionableAsync<NominationFileReport | null> {
    return async (queryRunner: QueryRunner) => {
      const reportPm = await queryRunner.manager.findOne(ReportPm, {
        where: { id },
      });
      if (!reportPm) return null;
      return reportPm.toDomain();
    };
  }
}
