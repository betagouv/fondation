import { Propagation, Transactional } from '@nestjs-cls/transactional';
import {
  ForbiddenException,
  forwardRef,
  Inject,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';

import {
  Report,
  ReportFilesAttached,
  ReportFilesDetached,
  ReportRuleValidationUpdated,
  ReportUpdated,
} from '../domain/report';
import { Prisma } from 'src/generated/prisma/client';
import { Db } from 'src/modules/framework/database';
import { Files } from 'src/modules/framework/files';
import { TransparenceService } from 'src/modules/session/transparence/infrastructure/transparence.service';
import { assertNever } from 'src/utils/assert-never';

@Injectable()
export class ReportRepository {
  private readonly logger = new Logger(ReportRepository.name);

  constructor(
    private readonly db: Db,
    private readonly files: Files,
    @Inject(forwardRef(() => TransparenceService))
    private readonly sessions: TransparenceService,
  ) {}

  async find(props: { id: string; reporterId: string }): Promise<Report> {
    const report = await this.db.tx.report.findUnique({
      select: { id: true, sessionId: true } satisfies Prisma.ReportSelect,
      where: { id: props.id, isDeleted: false, reporterId: props.reporterId },
    });
    if (!report) throw new NotFoundException();

    const state = await this.sessions.internalFindSessionState({ sessionId: report.sessionId });
    if (state !== 'OPEN') {
      this.logger.warn(`session ${report.sessionId} is ${state.toLowerCase()}`);
      throw new ForbiddenException();
    }

    return Report.from({ id: report.id });
  }

  @Transactional(Propagation.Mandatory)
  async persist(report: Report): Promise<void> {
    for (const message of report.messages) {
      if (message instanceof ReportFilesAttached) {
        await this.persistReportFilesAttached(message);
      } else if (message instanceof ReportFilesDetached) {
        await this.persistReportFilesDetached(message);
      } else if (message instanceof ReportUpdated) {
        await this.persistReportUpdated(message);
      } else if (message instanceof ReportRuleValidationUpdated) {
        await this.persistReportRuleValidationUpdated(message);
      } else {
        assertNever(message);
      }
    }
  }

  private async persistReportFilesDetached(message: ReportFilesDetached) {
    const report = await this.db.tx.report.findFirst({
      include: {
        files: {
          include: { file: { select: { id: true, name: true, path: true } } },
          where: { file: { name: { in: message.fileNames as string[] } } },
        },
      } satisfies Prisma.ReportInclude,
      where: { id: message.id, reporterId: message.reporterId },
    });

    const files = (report?.files ?? []).map(({ file }) => ({
      id: file.id,
      path: file.path,
    }));
    if (files.length === 0) return;

    await this.db.tx.reportFile.deleteMany({
      where: { fileId: { in: files.map(({ id }) => id) } },
    });

    this.files.delete(files);
  }

  private async persistReportFilesAttached(message: ReportFilesAttached) {
    await this.db.tx.reportFile.createMany({
      data: message.files.map(({ id }) => ({
        fileId: id,
        reportId: message.id,
        usage: message.usage,
      })),
    });
  }

  private async persistReportUpdated(message: ReportUpdated) {
    return this.db.tx.report.update({
      where: { id: message.id },
      data: { state: message.data.status, comment: message.data.comment },
    });
  }

  private async persistReportRuleValidationUpdated(message: ReportRuleValidationUpdated) {
    return this.db.tx.report.update({
      where: { id: message.id },
      data: {
        reportRules: {
          update: {
            where: { id: message.ruleId },
            data: { validated: message.isValidated },
          },
        },
      },
    });
  }
}
