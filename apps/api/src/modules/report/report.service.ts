import { Injectable } from '@nestjs/common';

import { ReportRepository } from './infrastructure/report.repository';
import { type ReportFileUsage, Role, NominationFile } from 'shared-models';
import {
  GetReportFileUrlsQuery,
  type GetReportFileUrlsResponseDto,
} from './infrastructure/queries/get-report-file-urls.query';
import {
  type DetailedReportDto,
  DetailReportQuery,
} from './infrastructure/queries/detail-report.query';

@Injectable()
export class ReportService {
  constructor(
    private readonly reportRepository: ReportRepository,
    private readonly getReportFileUrlsQuery: GetReportFileUrlsQuery,
    private readonly detailReportQuery: DetailReportQuery,
  ) {}

  async attachFiles(command: {
    userId: string;
    fileUsage: ReportFileUsage;
    reportId: string;
    files: readonly { id: string }[];
  }): Promise<void> {
    const report = await this.reportRepository.find({
      id: command.reportId,
      reporterId: command.userId,
    });
    report.attachFiles({
      reporterId: command.userId,
      fileUsage: command.fileUsage,
      files: command.files,
    });
    await this.reportRepository.persist(report);
  }

  async detachFiles(command: {
    userId: string;
    reportId: string;
    fileNames: readonly string[];
  }): Promise<void> {
    const report = await this.reportRepository.find({
      id: command.reportId,
      reporterId: command.userId,
    });
    report.detachFiles({
      fileNames: command.fileNames,
      reporterId: command.userId,
    });
    await this.reportRepository.persist(report);
  }

  getReportFileUrls(query: {
    userId: string;
    reportId: string;
    fileNames: readonly string[];
  }): Promise<GetReportFileUrlsResponseDto> {
    return this.getReportFileUrlsQuery.handle(query);
  }

  detailReport(query: {
    user: { id: string; role: Role };
    reportId: string;
  }): Promise<DetailedReportDto> {
    return this.detailReportQuery.handle(query);
  }

  async updateReport(command: {
    reportId: string;
    reporterId: string;
    data: {
      status: NominationFile.ReportState | undefined;
      comment: string | undefined;
    };
  }) {
    const report = await this.reportRepository.find({
      id: command.reportId,
      reporterId: command.reporterId,
    });
    report.update({ data: command.data });

    await this.reportRepository.persist(report);
  }

  async updateRuleValidation(command: {
    reportId: string;
    reporterId: string;
    ruleId: string;
    isValidated: boolean;
  }) {
    const report = await this.reportRepository.find({
      id: command.reportId,
      reporterId: command.reporterId,
    });
    report.updateRuleValidation({
      ruleId: command.ruleId,
      isValidated: command.isValidated,
    });

    await this.reportRepository.persist(report);
  }
}
