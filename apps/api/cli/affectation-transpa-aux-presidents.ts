import { NestFactory } from '@nestjs/core';
import { and, eq } from 'drizzle-orm';
import {
  allRulesTuple,
  Magistrat,
  NominationFile,
  Role,
  Transparency,
} from 'shared-models';
import { users } from 'src/identity-and-access-context/adapters/secondary/gateways/repositories/drizzle/schema';
import { reports } from 'src/reports-context/adapters/secondary/gateways/repositories/drizzle/schema/report-pm';
import { reportRules } from 'src/reports-context/adapters/secondary/gateways/repositories/drizzle/schema/report-rule-pm';
import { SharedKernelModule } from 'src/shared-kernel/adapters/primary/nestjs/shared-kernel.module';
import { DRIZZLE_DB } from 'src/shared-kernel/adapters/primary/nestjs/tokens';
import { DrizzleDb } from 'src/shared-kernel/adapters/secondary/gateways/repositories/drizzle/config/drizzle-instance';

async function affectationTranspaAuxPrésidents() {
  const app = await NestFactory.createApplicationContext(SharedKernelModule);
  const transpa = Transparency.DU_30_AVRIL_2025;

  try {
    const db = app.get(DRIZZLE_DB) as DrizzleDb;
    await db.transaction(async (tx) => {
      const présidentParquet = await tx
        .select()
        .from(users)
        .where(
          and(
            eq(users.firstName, 'rémy'),
            eq(users.lastName, 'heitz'),
            eq(users.role, Role.MEMBRE_DU_PARQUET),
          ),
        )
        .execute();
      if (!présidentParquet.length)
        throw new Error(
          'No user found with first name "rémy" and last name "heitz"',
        );
      if (présidentParquet.length > 1)
        throw new Error(
          'Multiple users found with first name "rémy" and last name "heitz"',
        );
      const présidentParquetId = présidentParquet[0]!.id;

      const présidentSiège = await tx
        .select()
        .from(users)
        .where(
          and(
            eq(users.firstName, 'christophe'),
            eq(users.lastName, 'soulard'),
            eq(users.role, Role.MEMBRE_DU_SIEGE),
          ),
        )
        .execute();
      if (!présidentSiège.length)
        throw new Error(
          'No user found with first name "christophe" and last name "soulard"',
        );
      if (présidentSiège.length > 1)
        throw new Error(
          'Multiple users found with first name "christophe" and last name "soulard"',
        );
      const présidentSiègeId = présidentSiège[0]!.id;

      for (const [formation, présidentReporterId] of [
        [Magistrat.Formation.PARQUET, présidentParquetId],
        [Magistrat.Formation.SIEGE, présidentSiègeId],
      ] as const) {
        const existingReports = await tx
          .select()
          .from(reports)
          .where(
            and(
              eq(reports.formation, formation),
              eq(reports.transparency, transpa),
            ),
          )
          .execute();
        if (!existingReports.length)
          throw new Error(`No report found for formation ${formation}`);

        for (const existingReport of existingReports) {
          const {
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            id,
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            createdAt,
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            comment,
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            attachedFiles,
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            version,
            reporterId,
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            state,
            ...newValues
          } = existingReport;

          if (reporterId === présidentReporterId)
            throw new Error(
              `Report ${existingReport.id} already has the correct reporterId for the formation ${formation}`,
            );

          const newReportRaw = await tx
            .insert(reports)
            .values({
              ...newValues,
              version: 1,
              comment: null,
              attachedFiles: null,
              reporterId: présidentReporterId,
              state: NominationFile.ReportState.NEW,
            })
            .returning({
              id: reports.id,
            })
            .execute();
          if (!newReportRaw.length)
            throw new Error(
              `No new report created for report ${existingReport.id}`,
            );
          const newReport = newReportRaw[0]!;

          const rules = await tx
            .select()
            .from(reportRules)
            .where(eq(reportRules.reportId, existingReport.id))
            .execute();
          if (!rules.length)
            throw new Error(`No rules found for report ${existingReport.id}`);
          if (rules.length !== allRulesTuple.length)
            throw new Error(
              `Report ${existingReport.id} has ${rules.length} rules, expected ${allRulesTuple.length}`,
            );

          await tx
            .insert(reportRules)
            .values(
              rules.map((r) => ({
                reportId: newReport.id,
                ruleGroup: r.ruleGroup,
                ruleName: r.ruleName,
                preValidated: r.preValidated,
                validated: true,
              })),
            )
            .execute();
        }
      }
    });
  } catch (error) {
    console.error(error);
    await app.close();
  } finally {
    await app.close();
  }
}

affectationTranspaAuxPrésidents();
