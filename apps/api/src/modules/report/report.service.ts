import { Propagation, Transactional } from '@nestjs-cls/transactional';
import { Injectable } from '@nestjs/common';

import { isDefined } from '../../utils/is-defined';
import { Files } from '../framework/files';
import { StoredFile } from '../framework/files/multipart/multipart.types';
import { FormationEnum } from '../shared/formation.enum';
import type { Impersonation } from '../shared/policies/personal-content.policies';
import { ReportFileUsageEnum } from '../shared/report-file-usage.enum';
import { ReportStateEnum } from '../shared/report-state.enum';
import type { RoleEnum } from '../shared/role.enum';

import { AttachedScreenshotsDto } from './infrastructure/dtos/report.dto';
import { type DetailedReportDto, DetailReportQuery } from './infrastructure/queries/detail-report.query';
import {
  type GeneratedReportAttachmentUrlDto,
  GetReportAttachmentUrlQuery,
} from './infrastructure/queries/get-report-attachment-url.query';
import {
  type ListedMemberSessionReportsDto,
  ListMemberSessionReportsQuery,
} from './infrastructure/queries/list-member-session-reports.query';
import {
  type FoundNominationFileMembersReportDto,
  SearchNominationFileMembersReportQuery,
} from './infrastructure/queries/search-nomination-file-members-report.query';
import { ReportRepository } from './infrastructure/report.repository';
import { SessionReportsRepository } from './infrastructure/session-reports.repository';

@Injectable()
export class ReportService {
  constructor(
    private readonly reportRepository: ReportRepository,
    private readonly sessionReportsRepository: SessionReportsRepository,
    private readonly getReportAttachmentUrlQuery: GetReportAttachmentUrlQuery,
    private readonly detailReportQuery: DetailReportQuery,
    private readonly listMemberSessionReportsQuery: ListMemberSessionReportsQuery,
    private readonly searchNominationFileMembersReportQuery: SearchNominationFileMembersReportQuery,
    private readonly files: Files,
  ) {}

  @Transactional()
  async attachFiles(command: {
    fileUsage: ReportFileUsageEnum | undefined;
    files: readonly { id: string }[];
    impersonation: Impersonation | undefined;
    reportId: string;
    userId: string;
  }): Promise<void> {
    const report = await this.reportRepository.find({
      id: command.reportId,
      impersonation: command.impersonation,
      reporterId: command.userId,
    });
    report.attachFiles({
      reporterId: command.userId,
      fileUsage: command.fileUsage ?? 'ATTACHMENT',
      files: command.files,
    });
    await this.reportRepository.persist(report);
  }

  @Transactional()
  async detachAttachment(command: {
    fileId: string;
    impersonation: Impersonation | undefined;
    reportId: string;
    userId: string;
  }): Promise<void> {
    const report = await this.reportRepository.find({
      id: command.reportId,
      impersonation: command.impersonation,
      reporterId: command.userId,
    });
    report.detachAttachment({ fileId: command.fileId });
    await this.reportRepository.persist(report);
  }

  async attachScreenshots(command: {
    files: readonly StoredFile[];
    impersonation: Impersonation | undefined;
    reportId: string;
    userId: string;
  }): Promise<AttachedScreenshotsDto> {
    await this.attachFiles({
      fileUsage: 'EMBEDDED_SCREENSHOT',
      files: command.files,
      impersonation: command.impersonation,
      reportId: command.reportId,
      userId: command.userId,
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

  getAttachmentUrl(query: {
    fileId: string;
    reportId: string;
    user: { id: string; impersonation: Impersonation | undefined; role: RoleEnum };
  }): Promise<GeneratedReportAttachmentUrlDto> {
    return this.getReportAttachmentUrlQuery.handle(query);
  }

  detailReport(query: {
    reportId: string;
    user: { id: string; impersonation: Impersonation | undefined; role: RoleEnum };
  }): Promise<DetailedReportDto> {
    return this.detailReportQuery.handle(query);
  }

  /** called by session within the publication transaction, for both to succeed or fail together */
  @Transactional(Propagation.Mandatory)
  async internalSyncReportsWithAffectations(command: {
    affectations: readonly { nominationFileId: string; reporterId: string }[];
    formation: FormationEnum;
    sessionId: string;
  }): Promise<void> {
    const sessionReports = await this.sessionReportsRepository.find(command);
    sessionReports.syncWith(command);
    await this.sessionReportsRepository.persist(sessionReports);
  }

  listMemberSessionReports(query: {
    sessionId: string;
    user: { id: string; role: RoleEnum };
  }): Promise<ListedMemberSessionReportsDto> {
    return this.listMemberSessionReportsQuery.handle(query);
  }

  searchNominationFileMembersReport(query: {
    nominationFileId: string;
    sessionId: string;
    userId: string;
  }): Promise<FoundNominationFileMembersReportDto> {
    return this.searchNominationFileMembersReportQuery.handle(query);
  }

  @Transactional()
  async updateReport(command: {
    data: {
      status: ReportStateEnum | undefined;
      comment: string | undefined;
    };
    impersonation: Impersonation | undefined;
    reportId: string;
    reporterId: string;
  }) {
    const report = await this.reportRepository.find({
      id: command.reportId,
      impersonation: command.impersonation,
      reporterId: command.reporterId,
    });
    report.update({ data: command.data });

    await this.reportRepository.persist(report);
  }

  @Transactional()
  async updateRuleValidation(command: {
    impersonation: Impersonation | undefined;
    isValidated: boolean;
    reportId: string;
    reporterId: string;
    ruleId: string;
  }) {
    const report = await this.reportRepository.find({
      id: command.reportId,
      impersonation: command.impersonation,
      reporterId: command.reporterId,
    });
    report.updateRuleValidation({
      ruleId: command.ruleId,
      isValidated: command.isValidated,
    });

    await this.reportRepository.persist(report);
  }
}
