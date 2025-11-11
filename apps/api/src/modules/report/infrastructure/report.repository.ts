import { Injectable, NotFoundException } from '@nestjs/common';

import { PrismaService } from 'src/modules/framework/database';
import { Files } from 'src/modules/framework/files';
import { assertNever } from 'src/utils/assert-never';
import { FullName } from 'src/reports-context/business-logic/models/full-name';

import { Report, ReportFilesAttached } from '../domain/report';
import z from 'zod';
import { ReportFileUsage } from 'shared-models';

@Injectable()
export class ReportRepository {
  constructor(
    private readonly prisma: PrismaService,
    private readonly files: Files,
  ) {}

  async find(props: { id: string; reporterId: string }): Promise<Report> {
    const result = await this.prisma.$transaction(async (tx) => {
      const report = await tx.report.findUnique({
        where: { id: props.id, reporterId: props.reporterId },
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

      const reporterFullName = new FullName(
        user?.firstName,
        user?.lastName,
      ).fullName();

      const session = await tx.session.findUnique({
        select: { name: true },
        where: { id: report?.sessionId },
      });
      if (!session) return null;

      const dossier = await tx.dossierDeNomination.findUnique({
        where: { id: report.nominationFileId },
      });
      if (!dossier) return null;

      // FIXME:
      //  We can't sprinkle the schema in the whole app.
      //  The most elegant solution would be to remove the report files path
      //  dependency on the session and nominationFile
      const nomAspirantResult = await z
        .discriminatedUnion('version', [
          z.object({ version: z.literal(1).nullable(), name: z.string() }),
          z.object({ version: z.literal(2), nomMagistrat: z.string() }),
        ])
        .transform((value) =>
          value.version === 2 ? value.nomMagistrat : value.name,
        )
        .safeParseAsync(dossier.content);

      if (!nomAspirantResult.success) return null;

      return {
        id: report.id,
        reporterFullName,
        sessionName: session.name,
        nomAspirant: nomAspirantResult.data,
      };
    });

    if (!result) throw new NotFoundException();

    return Report.from(result);
  }

  async persist(report: Report): Promise<void> {
    for (const message of report.messages) {
      if (message instanceof ReportFilesAttached) {
        await this.persistReportFilesAttached(message);
      } else {
        assertNever(message);
      }
    }
  }

  private async persistReportFilesAttached(event: ReportFilesAttached) {
    /** @warning this works at the moment, because operations are done in 2 separate transactions */
    const fileIds = await this.files.create(event.files);

    await this.prisma.$transaction(async (tx) => {
      await tx.reportFile.createMany({
        data: fileIds.map((fileId) => ({
          fileId,
          usage: event.usage,
          reportId: event.id,
        })),
      });

      // #region LEGACY BEHAVIOR

      const existingReport = await tx.report.findUnique({
        select: { attachedFiles: true },
        where: { id: event.id },
      });
      if (!existingReport) return;

      const result = await z
        .array(
          z.object({
            usage: z.enum(ReportFileUsage),
            name: z.string(),
            fileId: z.string(),
          }),
        )
        .safeParseAsync(existingReport.attachedFiles);
      if (!result.success) return;

      const files = await tx.file.findMany({
        select: { name: true, id: true },
        where: { id: { in: fileIds } },
      });

      const attachedFiles = result.data.concat(
        files.map((f) => ({ name: f.name, fileId: f.id, usage: event.usage })),
      );

      await tx.report.update({
        where: { id: event.id },
        data: { attachedFiles },
      });

      // #endregion LEGACY BEHAVIOR
    });
  }
}
