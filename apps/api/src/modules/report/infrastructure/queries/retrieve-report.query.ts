import { Injectable, NotFoundException } from '@nestjs/common';
import { createZodDto } from 'nestjs-zod';
import { dateOnlyJsonSchema, ReportFileUsage } from 'shared-models';
import z from 'zod';

import { PrismaService } from 'src/modules/framework/database';
import { NominationFileContentSchema } from 'src/modules/session/infrastructure/nomination-file-content.schema';

export class RetrieveReportResponseDto extends createZodDto(
  z.object({
    id: z.string(),
    sessionId: z.string(),
    state: z.string(),
    formation: z.string(),
    comment: z.string().nullable(),
    transparency: z.string(),
    dateTransparence: dateOnlyJsonSchema,
    attachedFiles: z
      .array(
        z.object({
          usage: z.nativeEnum(ReportFileUsage),
          name: z.string(),
          fileId: z.string(),
        }),
      )
      .nullable(),
    rules: z.record(z.string(), z.record(z.string(), z.any())),
    name: z.string(),
    grade: z.string(),
    birthDate: dateOnlyJsonSchema,
    biography: z.string().nullable(),
    currentPosition: z.string(),
    targettedPosition: z.string(),
    rank: z.string(),
    folderNumber: z.number().nullable(),
    dueDate: dateOnlyJsonSchema.nullable(),
    observers: z.array(z.string()).nullable(),
    dureeDuPoste: z.string().nullable(),
  }),
) {}

@Injectable()
export class RetrieveReportQuery {
  constructor(private readonly prisma: PrismaService) {}

  async handle(query: {
    reportId: string;
    reporterId: string;
  }): Promise<RetrieveReportResponseDto> {
    const report = await this.prisma.report.findFirst({
      where: { id: query.reportId, reporterId: query.reporterId },
      select: {
        id: true,
        sessionId: true,
        nominationFileId: true,
        state: true,
        formation: true,
        comment: true,
        reportRules: {
          select: {
            id: true,
            ruleGroup: true,
            ruleName: true,
            validated: true,
          },
        },
        files: {
          select: {
            usage: true,
            file: { select: { id: true, name: true } },
          },
        },
      },
    });

    if (!report) {
      throw new NotFoundException('Report not found');
    }

    const session = await this.prisma.session.findUnique({
      where: { id: report.sessionId },
      select: { name: true, content: true },
    });

    if (!session) {
      throw new NotFoundException('Session not found');
    }

    const dossier = await this.prisma.dossierDeNomination.findUnique({
      where: { id: report.nominationFileId },
      select: { content: true },
    });

    if (!dossier) {
      throw new NotFoundException('Dossier de nomination not found');
    }

    const sessionContent = this.parseSessionContent(session.content);
    const dossierData = this.parseDossierContent(dossier.content);
    const rules = this.buildRulesObject(report.reportRules);
    const attachedFiles = this.buildAttachedFiles(report.files);

    return {
      id: report.id,
      sessionId: report.sessionId,
      state: report.state,
      formation: report.formation,
      comment: report.comment,
      transparency: session.name,
      dateTransparence: sessionContent.dateTransparence,
      attachedFiles,
      rules,
      ...dossierData,
    };
  }

  private parseSessionContent(content: any) {
    return z.object({ dateTransparence: dateOnlyJsonSchema }).parse(content);
  }

  private parseDossierContent(content: any) {
    const normalized = NominationFileContentSchema.parse(content);

    return {
      name: normalized.nomMagistrat,
      birthDate: normalized.dateDeNaissance,
      grade: normalized.grade,
      biography: normalized.historique,
      currentPosition: normalized.posteActuel,
      targettedPosition: normalized.posteCible,
      rank: normalized.rang,
      folderNumber: normalized.numeroDeDossier,
      dueDate: normalized.dateEchéance,
      observers: normalized.observants,
      dureeDuPoste: normalized.datePriseDeFonctionPosteActuel
        ? this.calculateDureeDuPoste(normalized.datePriseDeFonctionPosteActuel)
        : null,
    };
  }

  private calculateDureeDuPoste(datePriseDeFonction: any): string {
    // Convertir en string si c'est un objet DateOnly
    const dateString =
      typeof datePriseDeFonction === 'string'
        ? datePriseDeFonction
        : `${datePriseDeFonction.year}-${String(datePriseDeFonction.month).padStart(2, '0')}-${String(datePriseDeFonction.day).padStart(2, '0')}`;

    const dateObj = new Date(dateString);
    const now = new Date();
    const months =
      (now.getFullYear() - dateObj.getFullYear()) * 12 +
      (now.getMonth() - dateObj.getMonth());

    const years = Math.floor(months / 12);
    const remainingMonths = months % 12;

    if (years === 0) return `${remainingMonths} mois`;
    if (remainingMonths === 0) return `${years} an${years > 1 ? 's' : ''}`;
    return `${years} an${years > 1 ? 's' : ''} et ${remainingMonths} mois`;
  }

  private buildRulesObject(
    reportRules: Array<{
      id: string;
      ruleGroup: string;
      ruleName: string;
      validated: boolean;
    }>,
  ): Record<string, Record<string, any>> {
    const rules: Record<string, Record<string, any>> = {};

    for (const rule of reportRules) {
      if (!rules[rule.ruleGroup]) {
        rules[rule.ruleGroup] = {};
      }

      rules[rule.ruleGroup]![rule.ruleName] = {
        id: rule.id,
        validated: rule.validated,
        preValidated: false,
      };
    }

    return rules;
  }

  private buildAttachedFiles(
    files: readonly { usage: string; file: { id: string; name: string } }[],
  ) {
    if (files.length === 0) return [];

    return files.map((f) => ({
      usage: f.usage as ReportFileUsage,
      name: f.file.name,
      fileId: f.file.id,
    }));
  }
}
