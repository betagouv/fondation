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

async function seed() {
  const app = await NestFactory.createApplicationContext(SharedKernelModule);

  try {
    const db = app.get(DRIZZLE_DB) as DrizzleDb;

    const report1 = new ReportBuilder()
      .withId(crypto.randomUUID())
      .withName('John Doe')
      .build();

    const reportRow1 = SqlNominationFileReportRepository.mapToDb(report1);
    await db.insert(reports).values(reportRow1).execute();

    const report1RulesPromises = rulesTuple.map(
      async ([ruleGroup, ruleName]) => {
        const reportRule = new ReportRuleBuilder()
          .withId(crypto.randomUUID())
          .withReportId(report1.id)
          .withRuleGroup(ruleGroup)
          .withRuleName(ruleName)
          .withPreValidated(false)
          .withValidated(false)
          .withComment(null)
          .build();

        const ruleRow = SqlReportRuleRepository.mapToDb(reportRule);
        await db.insert(reportRules).values(ruleRow).execute();
      },
    );
    await Promise.all(report1RulesPromises);

    const report2 = new ReportBuilder()
      .withId(crypto.randomUUID())
      .withName('Ada Lovelace')
      .withBiography('- Tribunal de grande instance de Paris')
      .withBirthDate(new DateOnly(1990, 1, 1))
      .withDueDate(new DateOnly(2025, 10, 1))
      .withFormation(Magistrat.Formation.PARQUET)
      .withGrade(Magistrat.Grade.HH)
      .withState(NominationFile.ReportState.OPINION_RETURNED)
      .withTransparency(Transparency.AUTOMNE_2024)
      .withCurrentPosition('Juge')
      .withTargettedPosition('Procureur')
      .withComment('Commentaire')
      .withRank('(1 sur une liste de 100)')
      .build();

    const reportRow2 = SqlNominationFileReportRepository.mapToDb(report2);
    await db.insert(reports).values(reportRow2).execute();

    const report2RulesPromises = rulesTuple.map(
      async ([ruleGroup, ruleName]) => {
        const reportRule = new ReportRuleBuilder()
          .withId(crypto.randomUUID())
          .withReportId(report2.id)
          .withRuleGroup(ruleGroup)
          .withRuleName(ruleName)
          .withPreValidated(true)
          .withValidated(true)
          .withComment(null)
          .build();

        const ruleRow = SqlReportRuleRepository.mapToDb(reportRule);
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
