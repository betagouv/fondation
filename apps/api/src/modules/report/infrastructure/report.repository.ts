import { ForbiddenException, Injectable, Logger, NotFoundException } from '@nestjs/common';

import {
  Report,
  ReportFilesAttached,
  ReportFilesDetached,
  ReportRuleValidationUpdated,
  ReportUpdated,
} from '../domain/report';
import { Db } from 'src/modules/framework/database';
import { Files } from 'src/modules/framework/files';
import { assertNever } from 'src/utils/assert-never';

@Injectable()
export class ReportRepository {
  private readonly logger = new Logger(ReportRepository.name);

  constructor(
    private readonly db: Db,
    private readonly files: Files,
  ) {}

  async find(props: { id: string; reporterId: string }): Promise<Report> {
    const result = await this.db.withTransaction(async () => {
      const report = await this.db.tx.report.findUnique({
        where: { id: props.id, reporterId: props.reporterId, isDeleted: false },
        select: { id: true, sessionId: true, nominationFileId: true },
      });
      if (!report) return null;

      /*
       * TODO:
       *  the reporter's full name, session and nominationFile are only used to create the file PATH,
       *  and is quite overkill for this use-case without the foreign keys.
       *
       *  WE SHOULD DELETE THIS BEHAVIOR IN FAVOR OF SOMETHING THAT MAKES SENSE.
       */
      const user = await this.db.tx.user.findUnique({
        where: { id: props.reporterId },
        select: { firstName: true, lastName: true },
      });
      if (!user) return null;

      const { firstName, lastName } = user;
      const reporterFullName =
        lastName.toUpperCase() + ' ' + (firstName.charAt(0).toUpperCase() + firstName.slice(1).toLowerCase());

      const session = await this.db.tx.session.findUnique({
        select: { name: true, deletedAt: true, archivedAt: true },
        where: { id: report?.sessionId },
      });

      if (!session) return null;
      if (session.archivedAt) {
        this.logger.warn(`session ${report.sessionId} is archived`);
        throw new ForbiddenException();
      }
      if (session.deletedAt) {
        this.logger.warn(`session ${report.sessionId} is deleted`);
        throw new ForbiddenException();
      }

      const dossier = await this.db.tx.dossierDeNomination.findUnique({
        where: { id: report.nominationFileId },
      });
      if (!dossier || !dossier.name) return null;

      return {
        id: report.id,
        reporterFullName,
        sessionName: session.name,
        nomAspirant: dossier.name,
      };
    });

    if (!result) throw new NotFoundException();

    return Report.from(result);
  }

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
    await this.db.withTransaction(async () => {
      const report = await this.db.tx.report.findFirst({
        where: { id: message.id, reporterId: message.reporterId },
        include: {
          files: {
            where: { file: { name: { in: message.fileNames as string[] } } },
            include: { file: { select: { name: true, path: true, id: true } } },
          },
        },
      });

      const files = (report?.files ?? []).map(({ file }) => ({
        id: file.id,
        path: file.path,
      }));

      if (files.length > 0) {
        await this.db.tx.reportFile.deleteMany({
          where: { fileId: { in: files.map(({ id }) => id) } },
        });

        this.files.delete(files);
      }
    });
  }

  private async persistReportFilesAttached(message: ReportFilesAttached) {
    const fileIds = message.files.map(({ id }) => id);
    await this.db.withTransaction(async () => {
      await this.db.tx.reportFile.createMany({
        data: fileIds.map((fileId) => ({
          fileId,
          usage: message.usage,
          reportId: message.id,
        })),
      });
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
