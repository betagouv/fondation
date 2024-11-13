import {
  Magistrat,
  NominationFile,
  rulesTuple,
  Transparency,
} from 'shared-models';
import { NestFactory } from '@nestjs/core';
import { ReportBuilder } from 'src/reports-context/business-logic/models/report.builder';
import {
  DRIZZLE_DB,
  SharedKernelModule,
} from 'src/shared-kernel/adapters/primary/nestjs/shared-kernel.module';
import { DateOnly } from 'src/shared-kernel/business-logic/models/date-only';
import { DrizzleDb } from 'src/shared-kernel/adapters/secondary/gateways/repositories/drizzle/config/drizzle-instance';
import { reports } from 'src/reports-context/adapters/secondary/gateways/repositories/drizzle/schema/report-pm';
import { reportRules } from 'src/reports-context/adapters/secondary/gateways/repositories/drizzle/schema/report-rule-pm';
import { SqlNominationFileReportRepository } from 'src/reports-context/adapters/secondary/gateways/repositories/drizzle/sql-nomination-file-report.repository';
import { SqlReportRuleRepository } from 'src/reports-context/adapters/secondary/gateways/repositories/drizzle/sql-report-rule.repository';
import crypto from 'crypto';
import { ReportRuleBuilder } from 'src/reports-context/business-logic/models/report-rules.builder';
import { NominationFileReport } from 'src/reports-context/business-logic/models/nomination-file-report';
import { ReportRule } from 'src/reports-context/business-logic/models/report-rules';

async function seed() {
  const app = await NestFactory.createApplicationContext(SharedKernelModule);

  try {
    const db = app.get(DRIZZLE_DB) as DrizzleDb;

    const reportSnapshot1 = new ReportBuilder()
      .with('id', crypto.randomUUID())
      .with('name', 'John Doe')
      .build();

    const reportRow1 = SqlNominationFileReportRepository.mapToDb(
      NominationFileReport.fromSnapshot(reportSnapshot1),
    );
    await db.insert(reports).values(reportRow1).execute();

    const report1RulesPromises = rulesTuple.map(
      async ([ruleGroup, ruleName]) => {
        const reportRule = new ReportRuleBuilder()
          .with('id', crypto.randomUUID())
          .with('reportId', reportSnapshot1.id)
          .with('ruleGroup', ruleGroup)
          .with('ruleName', ruleName)
          .with('preValidated', false)
          .with('validated', false)
          .with('comment', null)
          .build();

        const ruleRow = SqlReportRuleRepository.mapSnapshotToDb(reportRule);
        await db.insert(reportRules).values(ruleRow).execute();
      },
    );
    await Promise.all(report1RulesPromises);

    const reportSnapshot2 = new ReportBuilder()
      .with('id', crypto.randomUUID())
      .with('name', 'Ada Lovelace')
      .with('biography', '- Tribunal de grande instance de Paris')
      .with('birthDate', new DateOnly(1990, 1, 1))
      .with('dueDate', new DateOnly(2025, 10, 1))
      .with('formation', Magistrat.Formation.PARQUET)
      .with('grade', Magistrat.Grade.HH)
      .with('state', NominationFile.ReportState.OPINION_RETURNED)
      .with('transparency', Transparency.AUTOMNE_2024)
      .with('currentPosition', 'Juge')
      .with('targettedPosition', 'Procureur')
      .with('comment', 'Commentaire')
      .with('rank', '(1 sur une liste de 100)')
      .build();

    const reportRow2 =
      SqlNominationFileReportRepository.mapSnapshotToDb(reportSnapshot2);
    await db.insert(reports).values(reportRow2).execute();

    const report2RulesPromises = rulesTuple.map(
      async ([ruleGroup, ruleName]) => {
        const reportRule = new ReportRuleBuilder()
          .with('id', crypto.randomUUID())
          .with('reportId', reportSnapshot2.id)
          .with('ruleGroup', ruleGroup)
          .with('ruleName', ruleName)
          .with('preValidated', true)
          .with('validated', true)
          .with('comment', null)
          .build();

        const ruleRow = SqlReportRuleRepository.mapToDb(
          ReportRule.fromSnapshot(reportRule),
        );
        await db.insert(reportRules).values(ruleRow).execute();
      },
    );
    await Promise.all(report2RulesPromises);
  } catch (error) {
    console.error(error);
    await app.close();
  } finally {
    await app.close();
  }
}
seed();
