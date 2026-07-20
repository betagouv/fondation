import { Injectable } from '@nestjs/common';

import { Files } from '../framework/files';
import { StoredFile } from '../framework/files/multipart/multipart.types';
import { ReportFileUsageEnum } from 'src/modules/shared/report-file-usage.enum';
import { ReportStateEnum } from 'src/modules/shared/report-state.enum';
import type { RoleEnum } from 'src/modules/shared/role.enum';
import { isDefined } from 'src/utils/is-defined';

import { AttachedScreenshotsDto } from './infrastructure/dtos/report.dto';
import { type DetailedReportDto, DetailReportQuery } from './infrastructure/queries/detail-report.query';
import {
  GetReportFileUrlsQuery,
  type GetReportFileUrlsResponseDto,
} from './infrastructure/queries/get-report-file-urls.query';
import { type FoundMyReportDto, SearchMyReportQuery } from './infrastructure/queries/search-my-report.query';
import { ReportRepository } from './infrastructure/report.repository';

@Injectable()
export class ReportService {
  constructor(
    private readonly reportRepository: ReportRepository,
    private readonly getReportFileUrlsQuery: GetReportFileUrlsQuery,
    private readonly detailReportQuery: DetailReportQuery,
    private readonly searchMyReportQuery: SearchMyReportQuery,
    private readonly files: Files,
  ) {}

  async attachFiles(command: {
    userId: string;
    fileUsage: ReportFileUsageEnum | undefined;
    reportId: string;
    files: readonly { id: string }[];
  }): Promise<void> {
    const report = await this.reportRepository.find({
      id: command.reportId,
      reporterId: command.userId,
    });
    report.attachFiles({
      reporterId: command.userId,
      fileUsage: command.fileUsage ?? 'ATTACHMENT',
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

  async attachScreenshots(command: {
    files: readonly StoredFile[];
    reportId: string;
    userId: string;
  }): Promise<AttachedScreenshotsDto> {
    await this.attachFiles({
      userId: command.userId,
      reportId: command.reportId,
      files: command.files,
      fileUsage: 'EMBEDDED_SCREENSHOT',
    });

    const urls = await this.files.getPublicUrls(command.files.map((file) => file.id));

    return {
      items: command.files
        .map((file) => {
          const url = urls[file.id]?.toString();
          if (!url) return undefined;

          return {
            url,
            id: file.id,
            name: file.name,
          };
        })
        .filter(isDefined),
    };
  }

  getReportFileUrls(query: {
    userId: string;
    reportId: string;
    fileNames: readonly string[];
  }): Promise<GetReportFileUrlsResponseDto> {
    return this.getReportFileUrlsQuery.handle(query);
  }

  detailReport(query: {
    user: { id: string; role: RoleEnum };
    reportId: string;
  }): Promise<DetailedReportDto> {
    return this.detailReportQuery.handle(query);
  }

  searchMyReport(query: { nominationFileId: string; userId: string }): Promise<FoundMyReportDto> {
    return this.searchMyReportQuery.handle(query);
  }

  async updateReport(command: {
    reportId: string;
    reporterId: string;
    data: {
      status: ReportStateEnum | undefined;
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
