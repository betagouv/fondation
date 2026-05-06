import { Injectable, NotFoundException } from '@nestjs/common';

import {
  Report,
  ReportFilesAttached,
  ReportFilesDetached,
  ReportRuleValidationUpdated,
  ReportUpdated,
} from '../domain/report';
import { PrismaService } from 'src/modules/framework/database';
import { Files } from 'src/modules/framework/files';
import { assertNever } from 'src/utils/assert-never';

@Injectable()
export class ReportRepository {
  constructor(
    private readonly prisma: PrismaService,
    private readonly files: Files,
  ) {}

  async find(props: { id: string; reporterId: string }): Promise<Report> {
    const result = await this.prisma.$transaction(async (tx) => {
      const report = await tx.report.findUnique({
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
      const user = await tx.user.findUnique({
        where: { id: props.reporterId },
        select: { firstName: true, lastName: true },
      });
      if (!user) return null;

      const { firstName, lastName } = user;
      const reporterFullName =
        lastName.toUpperCase() + ' ' + (firstName.charAt(0).toUpperCase() + firstName.slice(1).toLowerCase());

      const session = await tx.session.findUnique({
        select: { name: true },
        where: { id: report?.sessionId, deletedAt: null },
      });
      if (!session) return null;

      const dossier = await tx.dossierDeNomination.findUnique({
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
    await this.prisma.$transaction(async (tx) => {
      const report = await tx.report.findFirst({
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
        await tx.reportFile.deleteMany({
          where: { fileId: { in: files.map(({ id }) => id) } },
        });

        this.files.delete(files);
      }
    });
  }

  private async persistReportFilesAttached(message: ReportFilesAttached) {
    const fileIds = message.files.map(({ id }) => id);
    await this.prisma.$transaction(async (tx) => {
      await tx.reportFile.createMany({
        data: fileIds.map((fileId) => ({
          fileId,
          usage: message.usage,
          reportId: message.id,
        })),
      });
    });
  }

  private async persistReportUpdated(message: ReportUpdated) {
    return this.prisma.report.update({
      where: { id: message.id },
      data: { state: message.data.status, comment: message.data.comment },
    });
  }

  private async persistReportRuleValidationUpdated(message: ReportRuleValidationUpdated) {
    return this.prisma.report.update({
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
