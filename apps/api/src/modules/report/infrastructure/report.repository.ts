import { Propagation, Transactional } from '@nestjs-cls/transactional';
import {
  ForbiddenException,
  forwardRef,
  Inject,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';

import { Prisma } from '../../../generated/prisma/client';
import { assertNever } from '../../../utils/assert-never';
import { fileIdsReferencedIn } from '../../../utils/rich-text-html';
import { Clock } from '../../framework/clock';
import { Db } from '../../framework/database';
import { Files } from '../../framework/files';
import { TransparenceService } from '../../session/transparence/infrastructure/transparence.service';
import {
  Report,
  ReportFilesAttached,
  ReportFilesDetached,
  ReportRuleValidationUpdated,
  ReportUpdated,
} from '../domain/report';

@Injectable()
export class ReportRepository {
  private readonly logger = new Logger(ReportRepository.name);

  constructor(
    private readonly clock: Clock,
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
    await this.db.tx.report.update({
      data: { comment: message.data.comment, state: message.data.status },
      where: { id: message.id },
    });
    if (message.data.comment !== undefined) {
      await this.syncScreenshotsWith({ comment: message.data.comment, reportId: message.id });
    }
  }

  private async syncScreenshotsWith(message: { comment: string; reportId: string }) {
    const embedded = [...fileIdsReferencedIn(message.comment)];
    const screenshots = { reportId: message.reportId, usage: 'EMBEDDED_SCREENSHOT' as const };

    await this.db.tx.reportFile.updateMany({
      data: { detachedAt: this.clock.now() },
      where: { ...screenshots, detachedAt: null, fileId: { notIn: embedded } },
    });
    await this.db.tx.reportFile.updateMany({
      data: { detachedAt: null },
      where: { ...screenshots, detachedAt: { not: null }, fileId: { in: embedded } },
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
